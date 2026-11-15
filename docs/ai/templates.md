---
title: Agent Instruction Templates
description: Copy-paste instruction files for GitHub Copilot, Claude, and other AI coding agents that work in projects using OpinionatedEventing.
---

# Agent instruction templates

Copy one of these into your own repository so your coding agent follows the library's rules. They are deliberately short and point at the website for details.

## Base rules (any agent)

Use for `AGENTS.md`, Cursor rules, or any agent that reads plain Markdown.

````markdown
## OpinionatedEventing

This project uses OpinionatedEventing (https://opinionated-eventing.com). It is newer than most
model training data. Do not guess the API. Read https://opinionated-eventing.com/llms.txt and
https://opinionated-eventing.com/docs/ai/agent-guide first.

Rules:
- Publish only through `IPublisher` (`PublishEventAsync` for events, `SendCommandAsync` for commands).
  It writes to the outbox. Never publish to the broker directly. There is no such API.
- `ICommand`: exactly one `ICommandHandler<T>`. `IEvent`: zero or more `IEventHandler<T>`.
- Delivery is at-least-once: handlers must be idempotent.
- Aggregates extend `AggregateRoot` and call `RaiseDomainEvent`. Never inject `IPublisher` into them.
- Register handlers with `AddHandlersFromAssemblies`; sagas with `AddSaga<T>` / `AddSagaParticipant<T>`.
- Call `SaveChangesAsync` once in the application layer; it commits business data and outbox rows together.
- Test with `OpinionatedEventing.Testing` (`InMemoryOutboxStore`, `InMemorySagaStateStore`, `FakeSagaContext`).
- If an API is not in https://opinionated-eventing.com/docs/ai/api-cheat-sheet, do not invent it.
````

## GitHub Copilot

Save as `.github/copilot-instructions.md` (or append to it). Use the base rules above verbatim.

## Claude Code

Save the base rules in `CLAUDE.md` at your repository root (or `AGENTS.md` and import it with `@AGENTS.md`).

For a reusable Claude skill, create `.claude/skills/opinionated-eventing/SKILL.md`:

````markdown
---
name: opinionated-eventing
description: Use when adding or changing messaging code (commands, events, handlers, outbox, sagas, aggregates) in a project that references OpinionatedEventing packages.
---

Before writing code, fetch https://opinionated-eventing.com/llms-full.txt (or read
https://opinionated-eventing.com/docs/ai/agent-guide and /docs/ai/api-cheat-sheet) and follow it.
Never publish directly to a broker. Do not invent APIs that are not in the cheat sheet.
````

## Other agents

Cursor, Windsurf, Gemini CLI, Aider and others: paste the base rules into the agent's rules or context file.
