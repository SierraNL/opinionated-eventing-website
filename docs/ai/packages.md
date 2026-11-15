---
title: Which package do I need?
description: Decision table mapping what a project does to the OpinionatedEventing NuGet packages it needs.
---

# Which package do I need?

## By project role

| Project does... | Install |
|---|---|
| Defines messages only (contracts / domain assembly) | `OpinionatedEventing.Abstractions` |
| Handles messages in a service host | `OpinionatedEventing` + one transport |
| Publishes events or sends commands | `OpinionatedEventing` + `OpinionatedEventing.Outbox` + `OpinionatedEventing.EntityFramework` + one transport |
| Uses sagas (orchestration or choreography) | Add `OpinionatedEventing.Sagas` |
| Tests handlers, sagas, aggregates | `OpinionatedEventing.Testing` (test projects only) |
| Local dev with Aspire | Aspire AppHost package(s), see below |
| Tracing and metrics | `OpinionatedEventing.OpenTelemetry` |

Receive-only services do not need EF Core.

## Package map

| Package | Contains |
|---|---|
| `OpinionatedEventing.Abstractions` | `IEvent`, `ICommand`, `IEventHandler<T>`, `ICommandHandler<T>`, `IPublisher`, `AggregateRoot`, `[MessageTopic]`, `[MessageQueue]` |
| `OpinionatedEventing` | `AddOpinionatedEventing`, `AddHandlersFromAssemblies`, `OpinionatedEventingOptions`, `IMessagingContext` |
| `OpinionatedEventing.Outbox` | `AddOutbox`, `OutboxDispatcherWorker`, `OutboxCleanupWorker`, `IOutboxStore`, `IOutboxMonitor` |
| `OpinionatedEventing.EntityFramework` | `AddOpinionatedEventingEntityFramework<TDbContext>`, `DomainEventInterceptor`, `ApplyOutboxConfiguration`, `ApplySagaStateConfiguration`, migration helpers |
| `OpinionatedEventing.Sagas` | `AddOpinionatedEventingSagas`, `AddSaga<T>`, `AddSagaParticipant<T>`, `SagaOrchestrator<TState>`, `ISagaParticipant<TEvent>`, `ISagaContext` |
| `OpinionatedEventing.AzureServiceBus` | `AddAzureServiceBusTransport` |
| `OpinionatedEventing.RabbitMQ` | `AddRabbitMQTransport` |
| `OpinionatedEventing.OpenTelemetry` | `AddOpinionatedEventingInstrumentation`, `AddOpinionatedEventingMetrics` |
| `OpinionatedEventing.Aspire` | `AddOpinionatedEventingHealthChecks` |
| `OpinionatedEventing.Aspire.AzureServiceBus` | AppHost `AddAzureServiceBusEmulator` |
| `OpinionatedEventing.Aspire.RabbitMQ` | AppHost `AddRabbitMqMessaging` |
| `OpinionatedEventing.Testing` | `InMemoryOutboxStore`, `InMemorySagaStateStore`, `FakeSagaContext`, `FakePublisher` |

Pick **one** transport per service.

:::note
Targets .NET 10 and 11. `AddOpinionatedEventingHealthChecks` comes from `OpinionatedEventing.Aspire`; the AppHost extensions (`AddRabbitMqMessaging`, `AddAzureServiceBusEmulator`) are documented under the same Aspire package in [Local Development](../local-development.md), while the homepage lists transport-specific `OpinionatedEventing.Aspire.*` packages. Check NuGet for the exact package IDs before adding references.
:::
