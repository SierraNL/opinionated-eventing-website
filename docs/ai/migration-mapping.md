---
title: Coming from MassTransit / NServiceBus / MediatR
description: Maps concepts from MassTransit, NServiceBus and MediatR to OpinionatedEventing and lists idioms that do not exist here.
---

# Coming from MassTransit / NServiceBus / MediatR

| Other library | OpinionatedEventing |
|---|---|
| MassTransit `IConsumer<T>` | `IEventHandler<T>` (events) or `ICommandHandler<T>` (commands) |
| NServiceBus `IHandleMessages<T>` | same as above |
| MediatR `IRequestHandler<TRequest>` | `ICommandHandler<T>` (but asynchronous via a broker, no return value) |
| MediatR `INotificationHandler<T>` | `IEventHandler<T>` |
| MassTransit `IPublishEndpoint.Publish` | `IPublisher.PublishEventAsync` (outbox) |
| MassTransit `ISendEndpoint.Send` / NServiceBus `Send` | `IPublisher.SendCommandAsync` (outbox) |
| MassTransit / NServiceBus transactional outbox | Built in and **the only publish path** |
| MassTransit `MassTransitStateMachine` / NServiceBus `Saga<T>` | `SagaOrchestrator<TState>` with `StartWith` / `Then` / `CompensateWith` |
| Process-manager-less choreography | `ISagaParticipant<TEvent>` |
| `AddMassTransit(x => x.UsingRabbitMq(...))` | `AddOpinionatedEventing().AddHandlersFromAssemblies(...).AddOutbox()` + `AddRabbitMQTransport(...)` |
| Correlation / conversation IDs | `CorrelationId` / `CausationId` via `IMessagingContext` |

## Things that do not exist here

- Publishing directly to the broker, or skipping the outbox.
- Request/response (`IRequestClient<T>`, `Send` returning a reply).
- Mediator-style in-process dispatch of commands with return values.
- Multiple handlers for one command.
- Configuring endpoints, consumers or retry middleware per consumer in code. Topology is derived from message types (override with `[MessageTopic]` / `[MessageQueue]`).

When a library feature from this list is requested, explain that it is a deliberate omission and propose the event/command equivalent.
