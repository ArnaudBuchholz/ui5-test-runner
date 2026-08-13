# ADR-0006: Batch Mode Orchestration

## Status
Accepted

## Context

`ui5-test-runner` targets monorepos and CI pipelines where dozens of independent UI5 projects must be tested in a single invocation. Running those projects in-process would require:

1. **Configuration isolation**: each project has its own config file, working directory, and option set; sharing a single `ConfigurationValidator` instance across N projects simultaneously is not feasible
2. **Browser lifecycle isolation**: each project may target a different browser or port; browser instances, server bindings, and file handles cannot be safely shared
3. **Report isolation**: each project produces its own CTRF report tree; cross-project accumulation would corrupt per-project detail
4. **Conditional execution**: some projects should be skipped based on environment conditions (`--if`); this evaluation must happen with access to each project's own environment, not a shared parent context
5. **Incremental visibility**: a long-running batch must report progress incrementally so CI logs show live status rather than silence until the end

Running items sequentially inside the parent process satisfies none of these needs at scale. An in-process threading approach (worker threads) would address isolation but introduces complex shared-memory coordination with no meaningful benefit over process-level isolation for I/O-bound test workloads.

## Decision

Each batch item is executed as an **independent child process** — a full invocation of `ui5-test-runner` — orchestrated by a parent process. A thin IPC channel carries only structured signal messages (progress and skip events) back to the parent; all test data stays on disk in per-project report subdirectories.

```
┌─────────────────────────────────────────────────────────┐
│  Parent process  (batch orchestrator)                   │
│                                                         │
│  resolve() ──► IBatchItem[]                             │
│                    │                                    │
│             parallelize() ──► up to N concurrent        │
│                    │                                    │
│      ┌─────────────┼─────────────┐                      │
│      ▼             ▼             ▼                      │
│  batchTask()   batchTask()   batchTask()                │
│  Process.spawn  Process.spawn  Process.spawn            │
└──────┬──────────────┬──────────────┬────────────────────┘
       │  IPC         │  IPC         │  IPC
       ▼              ▼              ▼
  ┌─────────┐    ┌─────────┐    ┌─────────┐
  │ child 1 │    │ child 2 │    │ child 3 │
  │ full    │    │ full    │    │ full    │
  │ runner  │    │ runner  │    │ runner  │
  └────┬────┘    └────┬────┘    └────┬────┘
       │              │              │
  reportDir/       reportDir/    reportDir/
    id1/ctrf.json    id2/ctrf.json  id3/ctrf.json
```

### Process Isolation

`batchTask()` (`src/modes/batch/batchTask.ts`) calls `Process.spawn()` with the child's CLI arguments and `UI5TR_BATCH_MODE=1` injected into its environment. Each child is a complete, independent Node.js process. It owns its configuration, server, browsers, and report files. When it exits, all its resources are released automatically by the OS.

### IPC as a Signal Channel

`Process.spawn()` opens an IPC stdio channel when `onMessage` is provided. Only two message types cross this channel:

| Message | Direction | Purpose |
|---|---|---|
| `{ type: 'progress', count: number, total: number }` | child → parent | Relay test-page progress to parent's terminal output |
| `{ type: 'skip' }` | child → parent | Signal that `--if` evaluated to false; item should be marked skipped |

All test data (assertions, timings, errors) stays in each child's own `<reportDir>/<id>/` subtree. The IPC channel carries no test results.

### Declarative Option Forwarding

Options that make sense to propagate from the parent CLI invocation to every child are marked `batchForwarded: true` in `src/configuration/options.ts` (the generated option registry). `batchTask()` calls `buildForwardedParameters(configuration)` which iterates these options and includes only those whose `configuration.sources[name] === 'cli'` — values from config files are intentionally excluded so each child project retains its own defaults.

### `UI5TR_BATCH_MODE` Environment Flag

The parent injects `UI5TR_BATCH_MODE=1` into every child's environment. This flag has two effects:

1. **`outputInterval` override**: `ConfigurationValidator` forces `outputInterval` to 1 000 ms (instead of the default 30 000 ms) so the child's static logger flushes progress frequently enough for the parent to relay it in real time
2. **IPC gate**: `sendToParentProcess()` (`src/sendToParentProcess.ts`) calls `Process.sendToParent()` only when `UI5TR_BATCH_MODE` is set; in a standalone run the call is a no-op, keeping the same code paths safe in both contexts

### `--if` Evaluated in the Child

`evaluateIf(configuration)` (`src/if.ts`) is called inside `cli.ts` before `execute()`. It evaluates the `--if` expression using `punyexpr` against a context built from the child's own environment variables plus helpers (`UI5TR_NAME`, `NODE_MAJOR_VERSION`, `compareVersions`, `implemented`). If the expression is falsy, the child immediately calls `sendToParentProcess({ type: 'skip' })` and exits without running any tests. The parent's `onMessage` handler sets `batchItem.skipped = true`.

Evaluating `--if` in the child rather than the parent ensures the expression has access to that project's specific environment, and keeps the skip logic co-located with the runner that would otherwise execute.

### Two-Level CTRF Reports

The batch produces two layers of reporting:

- **Child reports**: each child writes a full CTRF report to `<reportDir>/<id>/` — complete per-page test results
- **Aggregate batch report** (`src/modes/batch/report.ts`): the parent writes a summary CTRF report where each `IBatchItem` is one "test". Status maps: `skipped` → `'skipped'`; `statusCode === 0` → `'passed'`; anything else → `'failed'`. Duration is wall-clock time for that subprocess.

This follows the CTRF format used throughout the project and allows CI tools to consume either the high-level summary or drill into per-project detail.

## Consequences

### Positive
- ✅ **Complete isolation**: configuration, browser state, server ports, file handles, and exit codes are entirely separate per project
- ✅ **Predictable resource cleanup**: each child's resources are released by OS on process exit — no manual teardown coordination
- ✅ **Declarative forwarding policy**: `batchForwarded` in `options.ts` is the single place to control what propagates; no parallel allow-list in orchestration code
- ✅ **Uniform code paths**: the same `cli.ts` and `test/index.ts` run in both standalone and batch-child modes; `UI5TR_BATCH_MODE` provides the only branching
- ✅ **Two-level reporting**: consumers can inspect the aggregate or per-project detail without any special tooling

### Negative/Trade-offs
- ❌ **Process startup overhead**: each child pays the full Node.js startup cost; for many small projects this adds latency compared to in-process execution
- ❌ **No shared browser instance**: two children targeting the same browser binary cannot share a running browser; each spawns its own
- ❌ **IPC only for signals**: richer data (e.g. streaming test results to parent) would require protocol changes; the current channel is deliberately minimal

### Mitigation
- The `--parallel` option limits concurrent children, bounding peak resource consumption
- The `--if` skip mechanism avoids paying startup cost for projects that should not run
- The declarative `batchForwarded` approach makes the forwarding policy auditable without reading orchestration code

## Related Files & Modules

- **`src/modes/batch/index.ts`** — `batch()` orchestrator: resolves items, runs `start`, calls `parallelize`, writes aggregate report
- **`src/modes/batch/batchTask.ts`** — spawns one child process, wires IPC `onMessage` handler, records timing
- **`src/modes/batch/resolve.ts`** — discovers `IBatchItem[]` from `--batch` glob/path specs
- **`src/modes/batch/BatchItem.ts`** — `IBatchItem` interface: `path`, `id`, `label`, `args`, `start`, `end`, `statusCode`, `skipped`
- **`src/modes/batch/report.ts`** — builds aggregate CTRF report from completed `IBatchItem[]`
- **`src/if.ts`** — `evaluateIf()`: punyexpr evaluation of `--if` expression in child context
- **`src/sendToParentProcess.ts`** — guarded `process.send` wrapper; no-op when `UI5TR_BATCH_MODE` is absent
- **`src/platform/Process.ts`** — `Process.spawn()` with `SpawnOptionsExtended.onMessage` for IPC; `IProcess` interface
- **`src/configuration/options.ts`** — generated option registry; `batchForwarded: true` on forwarded options
- **`src/configuration/ConfigurationValidator.ts`** — detects batch mode; applies `outputInterval` override when `UI5TR_BATCH_MODE=1`
