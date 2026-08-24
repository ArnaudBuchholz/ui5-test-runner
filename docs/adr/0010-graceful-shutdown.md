# ADR-0010: Graceful Shutdown

## Status
Accepted

## Context

`ui5-test-runner` coordinates multiple long-lived resources — an HTTP server (Worker thread), one or more browser windows, spawned child processes (`start` command, batch children), and two logger worker threads. When the process receives SIGINT or encounters a fatal error, all of these resources must be released in the right order and without races.

Several constraints shaped the design:

1. **Order matters**: the HTTP server must stay alive while browser pages are still loading resources from it; pages must close before the browser is released; logger must stop last so shutdown events themselves are captured.
2. **Resources are created at different times**: a page task registered three seconds into a run must participate in shutdown just like a resource registered at startup.
3. **Shutdown can be triggered from multiple places**: SIGINT, an unhandled rejection in `cli.ts`, or a fatal assertion — all must converge on the same cleanup path without double-free races.
4. **Post-shutdown registrations must fail fast**: if a new page task tries to register after shutdown has started, silently succeeding would leave a dangling resource. It must throw immediately so the caller's error handler can deal with it.
5. **`using` / `Symbol.dispose`**: TypeScript 5.2+ TC39 explicit resource management allows scoped cleanup without manual `try/finally`. The registry must produce disposable handles.

## Decision

A single static class `Exit` (`src/platform/Exit.ts`) owns the task registry and the SIGINT handler. It is the only path to orderly shutdown.

### Task registry — LIFO order

```
Exit.registerAsyncTask({ name: string, stop: () => void | Promise<void> })
  → IRegisteredAsyncTask  (implements Symbol.dispose)
```

Every resource that needs cleanup calls `registerAsyncTask` when it is created. Registration returns a handle whose `[Symbol.dispose]()` removes the task from the list — used with `using` for automatic unregistration when a scope exits normally.

`shutdown()` drains `_asyncTasks` from the end (LIFO):

```
  SIGINT / fatal error
        │
        ▼
  Exit.shutdown()
        │
        ▼  tasks stopped in reverse registration order
  ┌───────────────────────────────────────────────────┐
  │  Exit._asyncTasks                                 │
  │                                                   │
  │  [0] HTTP server (registered first, stopped last) │
  │  [1] pageTask /foo.html                           │
  │  [2] pageTask /bar.html   ◄── stopped first       │
  │  [3] Process.spawn(start)                         │
  └───────────────────────────────────────────────────┘
        │
        ▼  (after all tasks stop)
  Exit._checkForHandlesLeak()
        │
        ▼
  logger.stop()
```

LIFO naturally encodes the dependency: resources registered later are typically innermost and should be torn down before outer resources they depend on.

### Post-shutdown registration throws `ExitShutdownError`

```typescript
static registerAsyncTask(task: IAsyncTask): IRegisteredAsyncTask {
  if (this._enteringShutdown) {
    throw new ExitShutdownError();
  }
  // …
}
```

`ExitShutdownError` is a named subclass of `Error`. Callers that cannot handle it (e.g. a new page task starting just as shutdown begins) propagate it up; `parallelize()` catches it via its stop mechanism. `logger.error` automatically downgrades records whose `error` is an `ExitShutdownError` to `debug` level, preventing spurious error noise in the terminal during a clean CTRL+C.

### SIGINT handler

```typescript
/* v8 ignore else -- @preserve */
if (Thread.isMainThread) {
  process.on('SIGINT', () => Exit.sigInt());
}
```

`sigInt()` sets `_logLevel` to `'info'` (so shutdown progress is visible on the terminal, not just in traces) then calls `shutdown()`. The handler is registered only on the main thread — worker threads do not call `Exit.shutdown()`.

### Handle leak detection

After all tasks have stopped, `_checkForHandlesLeak()` inspects `process._getActiveHandles()` and logs any unexpected handles. Known-safe handles (stdio streams, one `MessagePort` for the logger `BroadcastChannel`, `TLSSocket`/`Socket` which are destroyed immediately) are demoted to `debug`. Anything else is logged at `warn` so it is visible after a run.

### `Exit.code`

`process.exitCode` is accessed only via `Exit.code` (getter/setter). The setter asserts `Thread.isMainThread` — worker threads must never write `exitCode`. The end command uses this setter to exercise its unconditional authority over the final exit code (see [ADR-0007](./0007-start-end-command-lifecycle.md)).

## Consequences

### Positive
- ✅ **Single shutdown path**: SIGINT, unhandled rejection, and explicit `shutdown()` calls all converge on the same code — no parallel teardown races
- ✅ **Order guaranteed by construction**: LIFO registration eliminates the need for an explicit dependency graph
- ✅ **`using`-compatible**: `IRegisteredAsyncTask` implements `Symbol.dispose`, so scoped resources unregister themselves automatically without a `try/finally`
- ✅ **Post-shutdown safety**: `ExitShutdownError` surfaces races at the point of registration rather than silently leaking resources
- ✅ **Leak visibility**: `_checkForHandlesLeak()` catches handles that would keep the process alive after shutdown without any explicit process.exit() call

### Negative/Trade-offs
- ❌ **Static class**: `Exit` is a static singleton; it cannot be reset between test runs without explicit cleanup, so unit tests that exercise shutdown must restore state manually
- ❌ **`process._getActiveHandles` is undocumented**: the leak detector degrades gracefully when it is absent, but it relies on a Node.js internal
- ❌ **No timeout on individual tasks**: a `stop()` that hangs will block `shutdown()` indefinitely; there is no per-task timeout

### Mitigation
- Tests that exercise `Exit` reset `_asyncTasks` and `_enteringShutdown` in `afterEach`
- `_checkForHandlesLeak` logs a `warn` and returns (rather than throwing) when `_getActiveHandles` is absent
- The per-task timeout trade-off is accepted: resources are expected to be well-behaved, and a hung `stop()` is surfaced by the CI timeout rather than a silent hang

## Related Files & Modules

- **`src/platform/Exit.ts`** — `Exit` class, `ExitShutdownError`, `IAsyncTask`, `IRegisteredAsyncTask`
- **`src/platform/Process.ts`** — `Process.spawn()` auto-registers the child process with `Exit`
- **`src/modes/test/server.ts`** — HTTP server Worker registers with `Exit` on `ready`
- **`src/modes/test/pageTask.ts`** — each page task registers with `Exit`; catches `ExitShutdownError` via `parallelize`
- **`src/modes/mcp/index.ts`** — MCP server registers with `Exit`
- **`src/platform/logger.ts`** — `logger.stop()` is called last, after all tasks are drained
- **`src/platform/logger/types.ts`** — `logger.error` downgrades `ExitShutdownError` to `debug`
- **`src/end.ts`** — writes `Exit.code` after the end command closes (see [ADR-0007](./0007-start-end-command-lifecycle.md))
