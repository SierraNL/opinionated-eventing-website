---
title: Recipes
description: Task-oriented recipes for the most common OpinionatedEventing tasks.
---

# Recipes

## Add a command handler

1. Define the command in the contracts assembly: `public record ProcessPayment(Guid OrderId, decimal Amount) : ICommand;`
2. Implement exactly one `ICommandHandler<ProcessPayment>`.
3. Make sure its assembly is passed to `AddHandlersFromAssemblies(...)`.

```csharp
public class PaymentCommandHandler : ICommandHandler<ProcessPayment>
{
    public Task HandleAsync(ProcessPayment command, CancellationToken cancellationToken) { /* ... */ return Task.CompletedTask; }
}
```

A second handler for the same command fails at startup. If several parties must react, model it as an event.

## Publish an event from an aggregate

```csharp
public class Order : AggregateRoot
{
    public static Order Create(decimal total)
    {
        var order = new Order { Id = Guid.NewGuid(), Total = total };
        order.RaiseDomainEvent(new OrderPlaced(order.Id, total));
        return order;
    }
}

db.Orders.Add(Order.Create(total));
await db.SaveChangesAsync(ct); // DomainEventInterceptor writes the outbox row in the same transaction
```

Requires `DomainEventInterceptor` on the `DbContext` and `AddOpinionatedEventingEntityFramework<TDbContext>()`.

## Publish from application code

```csharp
await publisher.PublishEventAsync(new OrderPlaced(order.Id, total), ct);
await db.SaveChangesAsync(ct);
```

## Write an orchestrated saga

1. State class (POCO, serialised to JSON).
2. Class deriving `SagaOrchestrator<TState>` with `StartWith`, `Then`, optional `CompensateWith`, `ExpireAfter`, `OnTimeout`.
3. `ctx.Complete()` in the final step.
4. `services.AddOpinionatedEventingSagas(); services.AddSaga<MySaga>();`
5. `modelBuilder.ApplySagaStateConfiguration(Database.ProviderName)` and a migration.

Full example: [Saga Orchestration](../sagas-orchestration.md). For stateless flows use [choreography](../sagas-choreography.md).

## Make a handler idempotent

Pick the cheapest that fits: natural idempotency, unique constraint on `IMessagingContext.MessageId`, or pass the message ID as an idempotency key to an external API. See [Idempotency](../idempotency.md).

## Test a handler

Handlers are plain classes. Construct them and call `HandleAsync`.

```csharp
var handler = new PaymentCommandHandler();
await handler.HandleAsync(new ProcessPayment(orderId, 10m), CancellationToken.None);
```

## Test a saga participant

```csharp
var ctx = new FakeSagaContext { CorrelationId = Guid.NewGuid() };
await new FulfillmentParticipant(fakeInventory).HandleAsync(evt, ctx, CancellationToken.None);
Assert.Single(ctx.PublishedEvents.OfType<StockReserved>());
```

## Test aggregates and the outbox

```csharp
var order = Order.Create(100m);
Assert.Single(order.DomainEvents);          // no database needed

services.AddSingleton<IOutboxStore, InMemoryOutboxStore>(); // store.PendingMessages after SaveChanges
```

## Test saga timeouts

Register `FakeTimeProvider` as `TimeProvider` and call `clock.Advance(TimeSpan.FromMinutes(31))`.

## Run locally

Use the Aspire AppHost extensions (`AddRabbitMqMessaging` / `AddAzureServiceBusEmulator`). See [Local Development](../local-development.md).

## Enable CloudEvents

Not documented yet. Do not invent configuration; tell the user it is not covered.
