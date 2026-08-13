# ADR-0005: Logging and Tracing Architecture

## Status
Accepted

## Context

`ui5-test-runner` coordinates multiple browser processes running in parallel, each hosting several test pages. Understanding what went wrong after a test run requires being able to answer questions like:

- Which page failed and why?
- Did a network request silently return an unexpected status?
- Was a failure caused by an assertion in test code, a browser crash, or a configuration problem?
- How did CPU/memory evolve over time?

A plain `console.log` approach is inadequate here: output from concurrent processes interleaves, there is no machine-readable record to filter or query after the fact, and the terminal quickly becomes noise.

The system therefore separates **terminal output** (a human-friendly live view during the run) from **traces** (a complete, queryable record written to disk and inspectable afterward). Traces are the primary troubleshooting artefact.

## Decision

### Structured log records

Every log call emits a structured `InternalLogAttributes` record:

| Attribute | Type | Description |
|---|---|---|
| `level` | `LogLevel` | Severity: `debug(0)`, `info(1)`, `warn(2)`, `error(3)`, `fatal(4)` |
| `timestamp` | `number` | `Date.now()` at emission (UNIX ms) |
| `source` | `LogSource` | Logical origin of the event (see *Sources* below) |
| `message` | `string` | Human-readable description of the event |
| `processId` | `number` | OS PID of the emitting process |
| `threadId` | `number` | Worker thread ID; `-1` when no thread context |
| `isMainThread` | `boolean` | Whether the record comes from the main Node.js thread |
| `pageId?` | `number` | 0-based index of the browser page, set for page-scoped sources |
| `data?` | `object` | Source-specific structured payload (see *Sources* below) |
| `error?` | `IError` | Serialised error (never raw interpolation into `message`) |

Records are produced via `ILogger` — the five level methods `debug`, `info`, `warn`, `error`, `fatal` — each accepting `LogAttributes` (the caller-visible subset). `logger` is the single concrete implementation; use `proxy.ts` inside `platform/` to break the one unavoidable import cycle.

### Worker-based pipeline

After `logger.start(configuration)` is called, logging runs on two dedicated worker threads so I/O never blocks test execution:

1. **`allCompressed` worker** — writes every record to `report/traces-YYYYMMDD-HHMMSS.logz`
2. **`output` worker** — renders a filtered subset to the terminal

Records are delivered over a `BroadcastChannel` named `'logger'`. Before `start()` is called (during bootstrap), records are buffered in memory and flushed once both workers signal ready.

### Trace file format (`.logz`)

The `.logz` file is a **framed compressed stream**:

- Each frame is a raw-deflate-compressed block prefixed with a 4-byte big-endian length
- Frames are buffered (up to 50 records or 200 ms, whichever comes first) and written together
- The file is terminated by a 4-byte zero sentinel, which signals end-of-file to live readers
- Within each frame, records are encoded as compact text lines using a base-95 printable-ASCII encoding with context deduplication for `processId`/`source` (context lines are emitted only the first time a combination is seen)

This format supports live tailing: `LogReader` polls `stat()` every 500 ms for new bytes, so the log viewer can stream records while a run is still in progress.

### Sources and when to use them

`source` is the most important attribute for filtering during troubleshooting. It identifies **where** in the system the event originated, not what it says.

| Source | `pageId`? | `data` shape | When to use |
|---|---|---|---|
| `browser` | no | — | Browser process lifecycle: launch, close, crash |
| `browser/agent` | required | — | Events from the in-page QUnit/OPA agent injected by the runner |
| `browser/console` | required | `{ type: ConsoleMessageType }` | `console.*` calls inside the test page |
| `browser/network` | required | `{ request: { method, headers }, response: { status, headers } }` | Network requests made by the test page |
| `exit` | no | — | Graceful shutdown lifecycle |
| `exit/handle` | no | — | Signal handler (SIGINT etc.) |
| `http` | no | `{ requestId, init?, status?, headers? }` | HTTP requests made by the runner itself (not the browser) |
| `job` | no | — | Test job scheduling, queue management |
| `logger` | no | — | Logger internal events (startup, worker ready) |
| `metric` | no | `{ cpu, mem, elu }` | Periodic resource usage snapshot (every 1000 ms) |
| `npm` | no | — | `npm` subprocess lifecycle |
| `page` | required | — | Page-level lifecycle events (navigation, ready, timeout) |
| `playwright` | no | — | Playwright browser driver events |
| `process` | no | — | Spawned child process events |
| `process/stdout` | no | — | Raw stdout lines from a child process |
| `process/stderr` | no | — | Raw stderr lines from a child process |
| `progress` (overall) | no | `{ value, max }` | Overall test progress update |
| `progress` (page) | required | `{ value, max, errors, type, remove? }` | Per-page progress update |
| `puppeteer` | no | — | Puppeteer browser driver events |
| `reserve` | no | `Omit<ServerEvent, 'eventName'\|'reason'>` | REserve HTTP server request/response events |
| `server` | no | — | Embedded HTTP server lifecycle |
| `server/unhandled` | no | — | Unhandled requests to the embedded server |
| `thread` | no | — | Worker thread lifecycle |

**Page-scoped sources** (`browser/agent`, `browser/console`, `browser/network`, `page`, `progress` with a pageId) **must always include `pageId`**. Without it, records cannot be associated with a specific test page and are useless for per-page troubleshooting.

### Log levels: when to use each

| Level | Use when |
|---|---|
| `debug` | Internal events that are useful for deep diagnostics but generate too much noise for normal use: driver events, metric snapshots, socket-level request/response details, lifecycle state transitions |
| `info` | User-visible progress that confirms normal operation: a page starting, a job finishing, a server binding to a port |
| `warn` | Something unexpected happened but execution can continue: a non-fatal network error, a retry, a missing optional resource |
| `error` | One operation failed; the run continues but results may be incomplete: a page timed out, a browser crashed and was recovered |
| `fatal` | The run cannot continue: a required resource could not be obtained, an unrecoverable internal invariant was violated |

`logger.error()` automatically downgrades records whose `error` is an `ExitShutdownError` to `debug`, because those indicate an ordered shutdown rather than an actual failure.

### Terminal output vs. traces

The `output` worker applies a display filter: the following sources are **never rendered to the terminal** and are trace-only:

`browser`, `browser/agent`, `browser/console`, `browser/network`, `metric`, `process`, `process/stdout`, `process/stderr`, `progress`, `server/unhandled`

`debug` level is also suppressed on the terminal unless `forceRender: true` is passed.

This keeps the terminal clean during a run. All records, including suppressed ones, are always written to the `.logz` file.

### Inspecting traces

Two modes are available after a run (or while it is still running):

**Log viewer** (`--log <file>`, default): opens a browser-based UI backed by a local HTTP server. The viewer supports:
- Pagination and live auto-refresh
- Filtering by time range (relative or absolute)
- Per-column filters and a free-form punyexpr filter expression
- Clickable detail popover showing all attributes, with ±filter shortcuts

**Dump mode** (`--log <file> --log-dump`): streams the full trace as a JSON array to stdout. Combine with `--log-filter <punyexpr>` to pre-filter before piping to `jq` or other tools.

## Consequences

### Positive
- ✅ **Complete record**: every event from every process and thread is captured, regardless of terminal visibility
- ✅ **Non-blocking**: two worker threads handle I/O; the main thread and browser workers are never blocked by logging
- ✅ **Live inspection**: the framed+tailed format allows the log viewer to stream records during an active run
- ✅ **Compact on disk**: base-95 encoding with context deduplication and deflate compression significantly reduces file size relative to newline-delimited JSON
- ✅ **Rich filtering**: `pageId`, `source`, `level`, and `data` fields make it possible to isolate exactly the events relevant to a specific failure

### Negative / Trade-offs
- ❌ **Opaque format**: `.logz` files are not human-readable without the CLI (`--log-dump`) or viewer (`--log`)
- ❌ **Worker complexity**: the two-worker pipeline with a broadcast channel and pre-start buffer adds bootstrap complexity
- ❌ **Binary dependency**: the framed+compressed format ties the reader and writer to the same implementation; the format is not versioned

### Mitigation
- The log viewer and dump mode provide accessible read paths for any `.logz` file
- The bootstrap buffer ensures no records are lost before workers are ready
- The format is internal to the tool; external consumers should use `--log-dump` JSON output

## Conventions

### Every `logger` call must include `source` and `message`

```typescript
// ✅
logger.info({ source: 'job', message: 'test job started' });

// ❌ — source missing
logger.info({ message: 'test job started' });
```

### Pass errors in the `error` field, never in `message`

```typescript
// ✅
logger.error({ source: 'browser', message: 'browser crashed', error });

// ❌ — loses the stack trace and structured error data
logger.error({ source: 'browser', message: `browser crashed: ${error.message}` });
```

### Always include `pageId` for page-scoped sources

```typescript
// ✅
logger.debug({ source: 'browser/console', message: text, pageId, data: { type } });

// ❌ — cannot be associated with a page
logger.debug({ source: 'browser/console', message: text, data: { type } });
```

### Put structured context in `data`, not in `message`

```typescript
// ✅
logger.info({ source: 'http', message: 'request completed', data: { requestId, status: 200 } });

// ❌ — not filterable, not queryable
logger.info({ source: 'http', message: `request ${requestId} completed with status 200` });
```

### Use `debug` for high-frequency or driver-level events

Events that fire for every request, every frame, or every metric interval must be `debug`. Emitting them at `info` floods the terminal and masks real progress.

### Never use `console.log`, `console.warn`, or `console.error` in application code

All output must go through `logger` (imported from `'../platform/index.js'`). Direct `console.*` calls bypass the trace file and the terminal filter.

## Related Files & Modules

- **Logger interface and types**: `src/platform/logger/ILogger.ts`, `src/platform/logger/types.ts`
- **Concrete logger**: `src/platform/logger.ts`
- **File writer worker**: `src/platform/logger/allCompressed.ts`
- **Terminal output worker**: `src/platform/logger/output.ts`, `src/platform/logger/output/BaseLoggerOutput.ts`
- **Compression codec**: `src/platform/logger/compress.ts`
- **Trace reader**: `src/modes/log/LogReader.ts`, `src/utils/node/FramedStreamReader.ts`
- **Log mode (viewer + dump)**: `src/modes/log/index.ts`, `src/modes/log/LogStorage.ts`
- **Log viewer UI**: `src/ui/log/`
- **Platform abstraction**: see [ADR-0001](./0001-platform-abstraction-layer.md)
