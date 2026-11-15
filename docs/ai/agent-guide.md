---
title: Agent Guide
description: Rules for AI coding agents and developers using OpinionatedEventing. Design rules, wiring order, and do/don't list.
---

# Agent guide

OpinionatedEventing is new and opinionated. AI assistants often guess its API from MassTransit, NServiceBus or MediatR. Those guesses are usually wrong. Read this page before writing code that uses the library.

Other pages for agents: [API cheat sheet](api-cheat-sheet.md), [Which package do I need?](packages.md), [Recipes](recipes.md), [Coming from MassTransit / NServiceBus / MediatR](migration-mapping.md), [Instruction templates](templates.md). Machine-readable indexes: [`/llms.txt`](pathname:///llms.txt) and [`/llms-full.txt`](pathname:///llms-full.txt).

## Design rules

1. **There is no direct publish path.** `IPublisher` writes to the outbox table in the caller's transaction. A background worker forwards it to the broker. Never inject a broker client (`ServiceBusClient`, `IConnection`, ...) to publish.
2. **Commands and events are different things.**
   - `ICommand`: "please do X". Exactly **one** `ICommandHandler<T>` per command type. A second registration throws `InvalidOperationException` at startup.
   - `IEvent`: "X happened". **Zero or more** `IEventHandler<T>`.
3. **Send commands with `SendCommandAsync`, publish events with `PublishEventAsync`.** Both live on `IPublisher`.
4. **Delivery is at-least-once.** Handlers must tolerate duplicates. See [Idempotency](../idempotency.md).
5. **Aggregates raise events, they do not publish.** Extend `AggregateRoot` and call `RaiseDomainEvent(...)`. The `DomainEventInterceptor` writes the outbox rows during `SaveChangesAsync`. Never inject `IPublisher` into an aggregate.
6. **One `SaveChangesAsync` commits business data and outbox rows together.** Do not call it inside aggregate methods.
7. **Handler classes are registered by scanning.** Use `AddHandlersFromAssemblies`. Do not register `ICommandHandler<T>` / `IEventHandler<T>` by hand.
8. **Sagas are registered explicitly.** `AddSaga<T>()` for orchestrators, `AddSagaParticipant<T>()` for choreography participants. Both register the underlying event subscriptions for you.
9. **Transport is a DI choice.** Handler, aggregate and saga code never changes between Azure Service Bus and RabbitMQ.
10. **Name messages by intent.** Events in past tense (`OrderPlaced`), commands imperative (`ProcessPayment`). Avoid `OrderUpdated`, `DoSomething`.

## Wiring order in `Program.cs`

```csharp
// 1. Core + handlers + outbox
services
    .AddOpinionatedEventing()
    .AddHandlersFromAssemblies(Assembly.GetExecutingAssembly())
    .AddOutbox();

// 2. EF Core: interceptor on the DbContext, then the store
services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseSqlServer(connectionString);
    options.AddInterceptors(sp.GetRequiredService<DomainEventInterceptor>());
});
services.AddOpinionatedEventingEntityFramework<AppDbContext>();

// 3. Sagas (only if used)
services.AddOpinionatedEventingSagas();
services.AddSaga<OrderSaga>();

// 4. Exactly one transport
services.AddRabbitMQTransport(o => { o.ConnectionString = "..."; o.ServiceName = "order-service"; });
// or: services.AddAzureServiceBusTransport(o => { ... });
```

In `OnModelCreating` call `modelBuilder.ApplyOutboxConfiguration(Database.ProviderName)` (and `ApplySagaStateConfiguration(...)` when using sagas), then add an EF migration.

## Do / Don't

| Don't | Do |
|---|---|
| Publish to the broker directly | `await publisher.PublishEventAsync(evt, ct)` then `SaveChangesAsync` |
| Write two handlers for one command | One `ICommandHandler<T>`; use an event if several parties must react |
| Send a "command" with `PublishEventAsync` | `SendCommandAsync` for commands |
| Assume exactly-once delivery | Make handlers idempotent (natural, unique constraint, or message ID key) |
| Inject `IPublisher` into an aggregate | `RaiseDomainEvent(...)` |
| Call `SaveChanges` in a domain method | Let the application layer save once |
| Mix `ApplyOutboxConfiguration()` with `CreateOutboxTable()` | Pick one migration approach per project |
| Use `DateTime.UtcNow` in saga timeouts | Inject `TimeProvider`; use `FakeTimeProvider` in tests |
| Register a saga handler by hand | `AddSaga<T>()` / `AddSagaParticipant<T>()` |
| Stand up real brokers in unit tests | Use `OpinionatedEventing.Testing` fakes |

## When unsure

Check the [API cheat sheet](api-cheat-sheet.md) first. If an API you want is not on it, do not invent one. Look in the matching docs page, or tell the user the API is not documented.
