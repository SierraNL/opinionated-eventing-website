---
title: API Cheat Sheet
description: Every documented public entry point of OpinionatedEventing with a minimal example.
---

# API cheat sheet

Targets .NET 10 and 11. Only APIs that appear in the documentation are listed. If something is not here, do not guess; see the [Agent guide](agent-guide.md).

## Messages

```csharp
using OpinionatedEventing;

public record OrderPlaced(Guid OrderId, decimal Total) : IEvent;          // past tense
public record ProcessPayment(Guid OrderId, decimal Amount) : ICommand;    // imperative

[MessageTopic("payments.events.order-placed")]   // optional override, events
public record PaymentReceived(Guid OrderId, Guid PaymentId) : IEvent;

[MessageQueue("payments.commands.cancel-payment")] // optional override, commands
public record CancelPayment(Guid OrderId, string Reason) : ICommand;
```

Default broker names are derived from the type name: `OrderPlaced` becomes topic/exchange `order-placed`, `ProcessPayment` becomes queue `process-payment`. *Package: `OpinionatedEventing.Abstractions`.*

## Handlers

```csharp
public class NotifyHandler : IEventHandler<OrderPlaced>          // 0..n per event
{
    public Task HandleAsync(OrderPlaced @event, CancellationToken cancellationToken) => Task.CompletedTask;
}

public class PaymentHandler : ICommandHandler<ProcessPayment>    // exactly 1 per command
{
    public Task HandleAsync(ProcessPayment command, CancellationToken cancellationToken) => Task.CompletedTask;
}
```

## Publishing (always via the outbox)

```csharp
public class OrderService(IPublisher publisher, AppDbContext db)
{
    public async Task PlaceAsync(CancellationToken ct)
    {
        await publisher.PublishEventAsync(new OrderPlaced(id, total), ct);   // fan-out
        await publisher.SendCommandAsync(new ProcessPayment(id, total), ct); // point-to-point
        await db.SaveChangesAsync(ct); // commits business rows + outbox rows atomically
    }
}
```

## Aggregates

```csharp
public class Order : AggregateRoot
{
    public void Cancel(string reason) => RaiseDomainEvent(new OrderCancelled(Id, reason));
}
// aggregate.DomainEvents: IReadOnlyList<IEvent>, inspect in tests.
// ClearDomainEvents() is internal: only the framework calls it, never application code.
```

## Registration

```csharp
services.AddOpinionatedEventing(options =>              // options are optional
{
    options.Outbox.PollInterval = TimeSpan.FromSeconds(1);
    options.Outbox.BatchSize = 50;
    options.Outbox.MaxAttempts = 5;
    options.Outbox.ConcurrentWorkers = 1;
    options.Outbox.MaxRetryDelay = TimeSpan.FromMinutes(5);
    options.Outbox.ProcessedRetention = TimeSpan.FromDays(7); // null = keep forever
    options.Outbox.FailedRetention = null;
    options.Outbox.CleanupInterval = TimeSpan.FromHours(1);
})
.AddHandlersFromAssemblies(Assembly.GetExecutingAssembly())
.AddOutbox();

services.AddOpinionatedEventingEntityFramework<AppDbContext>();
services.AddOpinionatedEventingSagas(o => o.TimeoutCheckInterval = TimeSpan.FromSeconds(30)); // options optional
services.AddSaga<OrderSaga>();
services.AddSagaParticipant<FulfillmentParticipant>();

services.AddRabbitMQTransport(o => { o.ConnectionString = "..."; o.ServiceName = "order-service"; o.AutoDeclareTopology = true; });
services.AddAzureServiceBusTransport(o => { o.ConnectionString = "..."; o.ServiceName = "order-service"; o.AutoCreateResources = true; });
```

## EF Core

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyOutboxConfiguration(Database.ProviderName);
    modelBuilder.ApplySagaStateConfiguration(Database.ProviderName); // only with sagas
}

options.AddInterceptors(sp.GetRequiredService<DomainEventInterceptor>());

// Alternative to model-based migrations (do not mix):
migrationBuilder.CreateOutboxTable();  migrationBuilder.CreateSagaStateTable();
migrationBuilder.DropOutboxTable();    migrationBuilder.DropSagaStateTable();
migrationBuilder.AddOutboxRetentionColumns(); // incremental upgrade
```

## Sagas

```csharp
public class OrderSaga : SagaOrchestrator<OrderSagaState>
{
    protected override void Configure(ISagaBuilder<OrderSagaState> builder) => builder
        .StartWith<OrderPlaced>(async (evt, state, ctx) => await ctx.SendCommandAsync(new ProcessPayment(evt.OrderId, evt.Total)))
        .Then<PaymentReceived>((evt, state, ctx) => { ctx.Complete(); return Task.CompletedTask; })
        .CompensateWith<PaymentFailed>(async (evt, state, ctx) => await ctx.SendCommandAsync(new CancelPayment(state.OrderId, evt.Reason)))
        .ExpireAfter(TimeSpan.FromMinutes(30))     // or ExpireAt(DateTimeOffset)
        .OnTimeout(async (state, ctx) => await ctx.SendCommandAsync(new CancelPayment(state.OrderId, "Timed out")));
    // builder.CorrelateBy<PaymentReceived>(evt => evt.OrderId.ToString()) to correlate by payload
}

public class FulfillmentParticipant : ISagaParticipant<PaymentReceived>   // choreography
{
    public Task HandleAsync(PaymentReceived @event, ISagaContext ctx, CancellationToken ct)
        => ctx.PublishEventAsync(new StockReserved(ctx.CorrelationId, "SKU", 1), ct);
}
```

`ISagaContext`: `CorrelationId`, `SendCommandAsync`, `PublishEventAsync`, `Complete()`. Saga statuses: `Active`, `Completed`, `Compensating`, `Failed`, `TimedOut`.

## Context, monitoring, health

```csharp
IMessagingContext   // CorrelationId, CausationId, MessageId of the message being handled
IOutboxMonitor      // GetPendingCountAsync(ct), GetDeadLetterCountAsync(ct)

services.AddHealthChecks().AddOpinionatedEventingHealthChecks(o =>
{
    o.OutboxBacklogThreshold = 100;
    o.SagaTimeoutBacklogThreshold = 10;
});
services.AddOpenTelemetry()
    .WithTracing(t => t.AddOpinionatedEventingInstrumentation())
    .WithMetrics(m => m.AddOpinionatedEventingMetrics());
```

## Aspire AppHost

```csharp
var rabbit = builder.AddRabbitMqMessaging("rabbitmq");
var asb = builder.AddAzureServiceBusEmulator("servicebus");
builder.AddProject<Projects.Api>("api").WithReference(rabbit);
```

## Testing (`OpinionatedEventing.Testing`)

```csharp
services.AddSingleton<IOutboxStore, InMemoryOutboxStore>();   // store.PendingMessages
services.AddSingleton<ISagaStateStore>(new InMemorySagaStateStore());
services.AddSingleton<TimeProvider>(new FakeTimeProvider());   // clock.Advance(...)
var ctx = new FakeSagaContext { CorrelationId = Guid.NewGuid() }; // ctx.SentCommands, ctx.PublishedEvents, ctx.IsCompleted, ctx.SentCommands, ctx.PublishedEvents (IReadOnlyList<object>; use .OfType<T>())
```
