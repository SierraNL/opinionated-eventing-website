---
sidebar_position: 8
title: Observability
---

# Observability

OpinionatedEventing emits structured logs, distributed traces, and metrics out of the box. All telemetry uses standard .NET abstractions — no Serilog, Seq, or OpenTelemetry package is required in the library itself.

## Logging

The library uses `Microsoft.Extensions.Logging.ILogger<T>`. As long as you configure a logging provider in your host, log output flows automatically.

### What is logged

| Component | Level | Events |
|---|---|---|
| `OutboxDispatcherWorker` | `Debug` | Poll cycle start/end, batch size |
| `OutboxDispatcherWorker` | `Information` | Message dispatched successfully |
| `OutboxDispatcherWorker` | `Warning` | Dispatch attempt failed (retrying) |
| `OutboxDispatcherWorker` | `Error` | Message dead-lettered after MaxAttempts |
| `SagaTimeoutWorker` | `Debug` | Timeout check cycle |
| `SagaTimeoutWorker` | `Information` | Saga timed out, timeout handler invoked |
| `SagaTimeoutWorker` | `Error` | Timeout handler threw exception |
| Transport consumers | `Debug` | Message received |
| Transport consumers | `Information` | Message handled successfully |
| Transport consumers | `Error` | Handler threw unhandled exception |

### Configuring log levels

In `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "OpinionatedEventing": "Debug"
    }
  }
}
```

## Distributed tracing

The library uses `System.Diagnostics.ActivitySource`. Wire up spans via the OpenTelemetry SDK:

```csharp
using OpinionatedEventing.OpenTelemetry;

services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .AddOpinionatedEventingInstrumentation()
        .AddOtlpExporter());
```

### Emitted spans

| Span name | When | Key attributes |
|---|---|---|
| `outbox.write` | `IPublisher` writes to the outbox store | `messaging.message.type`, `messaging.message.kind`, `messaging.message.correlation_id` |
| `outbox.dispatch` | `OutboxDispatcherWorker` calls `ITransport.SendAsync` | `messaging.message.id`, `messaging.message.type` |
| `consume` | Transport consumer hands off to handler(s) | `messaging.message.type`, `messaging.message.kind`, `messaging.message.correlation_id` |
| `saga.step` | A saga handler executes | `saga.type`, `saga.correlation_key`, `messaging.message.type` |

Each span carries W3C trace context propagated through the message envelope so traces span service boundaries.

When using Aspire, the dashboard includes a built-in trace viewer. Traces from all services are aggregated automatically — no additional exporter configuration is needed for local development.

## Metrics

Wire up the metrics provider:

```csharp
using OpinionatedEventing.OpenTelemetry;

services.AddOpenTelemetry()
    .WithMetrics(metrics => metrics
        .AddOpinionatedEventingMetrics()
        .AddOtlpExporter());
```

### Available instruments

| Instrument | Type | Description |
|---|---|---|
| `opinionatedeventing.outbox.pending` | Gauge | Current number of pending (unprocessed) outbox messages |
| `opinionatedeventing.outbox.processed` | Counter | Total messages successfully dispatched to the broker |
| `opinionatedeventing.outbox.failed` | Counter | Total messages dead-lettered after MaxAttempts |
| `opinionatedeventing.publish.duration` | Histogram | Time (ms) to write a message to the outbox store |
| `opinionatedeventing.dispatch.duration` | Histogram | Time (ms) to dispatch a message to the broker |
| `opinionatedeventing.consume.duration` | Histogram | Time (ms) for the handler to process a message |
| `opinionatedeventing.saga.active` | Gauge | Current number of active saga instances |
| `opinionatedeventing.saga.timed_out` | Counter | Total sagas that have timed out |

### Alerting recommendations

| Metric | Alert condition | Meaning |
|---|---|---|
| `opinionatedeventing.outbox.pending` | > threshold for > 5 min | Dispatcher is stalled or the broker is unavailable |
| `opinionatedeventing.outbox.failed` | Rate > 0 | Messages are dead-lettering — investigate errors |
| `opinionatedeventing.consume.duration` | p99 > SLA | Handler is slow — risk of broker timeout and redelivery |
| `opinionatedeventing.saga.active` | Growing without bound | Sagas are not completing — check timeouts |

## Health checks

```csharp
services.AddHealthChecks()
    .AddOpinionatedEventingHealthChecks(options =>
    {
        options.OutboxBacklogThreshold = 100;
        options.SagaTimeoutBacklogThreshold = 10;
    });

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/live",  new HealthCheckOptions { Predicate = c => c.Tags.Contains("live") });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = c => c.Tags.Contains("ready") });
```

| Tag | Checks |
|---|---|
| `live` | Broker connectivity |
| `ready` | Outbox backlog, saga timeout backlog |

To automatically pause consumers when a dependency becomes unavailable:

```csharp
services.AddHealthChecks()
    .AddOpinionatedEventingHealthChecks()
    .AddNpgsql(connectionString, tags: ["pause"])
    .WithConsumerPause();
```

## Correlation and causation IDs

Every message carries two identifiers:

- **CorrelationId** — Set at the entry point and propagated through every event and command in the chain.
- **CausationId** — The `Id` of the message that caused this one to be sent.

These IDs are accessible in handlers via `IMessagingContext`:

```csharp
public class OrderNotificationHandler(IMessagingContext context) : IEventHandler<OrderPlaced>
{
    public Task HandleAsync(OrderPlaced @event, CancellationToken ct)
    {
        // context.CorrelationId — same across the entire order flow
        // context.CausationId  — ID of the message that triggered this handler
        return Task.CompletedTask;
    }
}
```

### Automatic logging scope

`MessageHandlerRunner` calls `ILogger.BeginScope` before invoking handlers, pushing `CorrelationId`, `CausationId`, and `MessageType` as structured properties into the ambient logging scope:

```json
{
  "CorrelationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "CausationId":   "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "MessageType":   "MyApp.Orders.OrderPlaced, MyApp"
}
```

Any `ILogger<T>` used inside a handler automatically inherits these properties.
