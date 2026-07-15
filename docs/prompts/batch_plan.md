# Batch Mode — Implementation Plan

## Overview

Port batch mode from the legacy `src/batch.js` (JavaScript) to the current TypeScript codebase under `src/modes/batch/`. This introduces a new execution mode where a single invocation orchestrates multiple independent test projects as forked child processes.

---

## Open Questions

> ⚠️ The following must be resolved before implementation begins.

### Q1 — `--if` option: shared or batch-only? ✅ RESOLVED

Add `--if` as a regular CLI option (`string`, no default). Available globally; evaluated in `cli.ts` before dispatching to any mode.

---

### Q2 — `--batch-mode` flag: hidden option or internal state? ✅ RESOLVED

Use an environment variable `UI5TR_BATCH_MODE=1` instead of a CLI flag. The parent sets it when spawning each child; the child reads it via `Host.env` and forces `outputInterval = 1000`. No `batchMode` option added to `options.ts`. The `batchId` and `batchLabel` doc files are also not needed as CLI options — they are JSON config file fields only (read directly from the parsed JSON, never via CLI parsing).

---

### Q3 — `$valueSources` / option forwarding ✅ RESOLVED

Add `sources: Partial<Record<keyof Configuration, 'cli' | 'config' | 'default'>>` to the `Configuration` type. `CommandLine.buildConfigurationFrom()` records `'cli'` for every explicitly-passed argv key; `ConfigurationValidator.merge()` records `'config'` for keys that arrived from the config file. Keys absent from `sources` are implicitly `'default'`. `task()` uses `configuration.sources[name] === 'cli'` to decide which `batchForwarded` options to forward to child processes.

---

### Q4 — `📡` forwarding flags on options ✅ RESOLVED

Add `batchForwarded: true` to the `Option` type and annotate each relevant option in `docs/options/*.md`, then regenerate `options.ts` via `npm run build:options`. The batch task reads `options.filter(o => o.batchForwarded)` at runtime to build the forwarding dictionary.

---

### Q5 — Child process forking: `fork()` vs `Process.spawn()` ✅ RESOLVED

Extend `Process.spawn()` to support IPC by passing `'ipc'` in the `stdio` array. Add an `onMessage` callback to the spawn options so callers can receive IPC messages. `IProcess` gains an optional `send()` method when IPC is active. `fork()` is not needed — `spawn` with `stdio: [0, fileHandle, fileHandle, 'ipc']` is equivalent for this use case. Everything stays inside `src/platform/`.

---

### Q6 — `FileSystem` additions needed ✅ RESOLVED

Add only `readdir` to `FileSystem.ts` (needed for regex folder scanning). `open`/`close`/`unlink` are not needed — the legacy stdout/stderr capture-to-files pattern is dropped; the new codebase uses structured `logger` output instead.

---

## Proposed File Structure

```
src/modes/batch/
  index.ts              ← exports batch() — the ModeFunction
  task.ts               ← task() — runs one BatchItem as a child process
  resolve.ts            ← folder(), configurationFile(), regex scan logic
  BatchItem.ts          ← BatchItem interface
  batchId.ts            ← filename() hash utility (SHAKE-256, 8 bytes, base64url)
  index.spec.ts         ← unit tests for batch()
  task.spec.ts          ← unit tests for task()
  resolve.spec.ts       ← unit tests for folder/configFile/scan
```

---

## Implementation Steps

### Step 1 — Add new CLI options (docs + regenerate)

Edit the following doc files and run `npm run build:options` after each group:

| Doc file to create | Option name | Type | Default | Notes |
|---|---|---|---|---|
| `docs/options/batch.md` | `batch` | `string` | — | `multiple: true`; triggers batch mode |
| `docs/options/if.md` | `if` | `string` | — | Conditional; evaluated in child via `punyexpr` |

`batchId` and `batchLabel` are **not** CLI options — they are JSON config file fields read directly in `configurationFile()` and never parsed by `CommandLine`.

`batch` is the mode trigger: `ConfigurationValidator.computeMode()` must check `configuration.batch` first, before `url` / `log`.

---

### Step 2 — Update `ConfigurationValidator.computeMode()`

Add `batch` mode detection **before** `log` and `url` checks:

```typescript
if (configuration.batch) {
  return Modes.batch;
}
```

---

### Step 3 — `outputInterval` override for batch-mode children

In `ConfigurationValidator.validate()` (or a dedicated post-validate step), when `Host.env['UI5TR_BATCH_MODE']` is set, force:

```typescript
configuration.outputInterval = 1000;
```

This ensures children send IPC progress updates every 1 second regardless of the default 30 s.

---

### Step 4 — Platform additions

#### 4a — `FileSystem.ts`
Add `readdir`. Update `platform/mock.ts` to mock it.

#### 4b — `Process.ts`
Extend `Process.spawn()` to support IPC:
- Add optional `onMessage` callback to spawn options
- When provided, pass `'ipc'` in the `stdio` array and wire `childProcess.on('message', onMessage)`
- Extend `IProcess` with optional `send(data: unknown): void`

Update `platform/mock.ts` to cover the extended `Process.spawn` behaviour.

---

### Step 5 — `src/modes/batch/BatchItem.ts`

```typescript
export interface IBatchItem {
  readonly path: string;
  readonly id: string;
  readonly label: string;
  readonly args: string[];   // ['--cwd', path] or ['--config', path]
  start?: Date;
  end?: Date;
  statusCode?: number;
}
```

---

### Step 6 — `src/modes/batch/resolve.ts`

Ports `folder()`, `configurationFile()`, and the `scan()` regex walker from `src/batch.js`.

Key details:
- Uses `FileSystem.stat()`, `FileSystem.readdir()` (new)
- Uses `Module.createRequire()` to `require()` JSON config files (already in platform)
- Logs `logger.warn` for `batchFailed` conditions (replacing legacy `output.batchFailed`)
- Windows path normalization: test regex against both native path and `.replaceAll('\\', '/')`
- `configurationFile()` reads `batchId` and `batchLabel` from the JSON; both fall back to the **basename** of the config file path (e.g. `JS_LEGACY.json`)
- `folder()` fallback `id` and `label` are both the **basename** of the folder path

---

### Step 7 — `src/modes/batch/task.ts`

Ports `task()` from `src/batch.js`. Key TypeScript decisions:

- Takes `(configuration: Configuration, batchItem: IBatchItem): Promise<void>`
- Uses extended `Process.spawn()` with `onMessage` for IPC progress updates
- Sets `UI5TR_BATCH_MODE=1` in the child's environment
- Builds `parameters` array:
  - starts with `batchItem.args`
  - appends `--report-dir <parentReportDir>/<id>` when `reportDir` was CLI-sourced (see Q3)
  - appends forwarded `batchForwarded` options that were CLI-sourced (see Q3)
- No stdout/stderr log files — child output goes through its own structured logger
- Logs `logger.info` for ✔️ / ❌ outcomes

---

### Step 8 — `src/modes/batch/index.ts`

Ports `batch()` as the `ModeFunction`:

```typescript
export const batch = async (configuration: Configuration): Promise<void> => { ... }
```

Key steps:
1. Resolve all specs into `IBatchItem[]` (via `resolve.ts`)
2. If empty → log warn + return
3. `parallelize(task, batchItems, { parallel: configuration.parallel })`
4. Aggregate failures, set `Exit.code = -1` if any failed

The `start` command (if any) is handled internally by the mode (same pattern as `test` mode) — not by `execute.ts`.

---

### Step 9 — Wire up in `execute.ts`

Replace the `notImplemented` stub for `Modes.batch`:

```typescript
import { batch } from './batch/index.js';
// ...
[Modes.batch]: batch,
```

---

### Step 10 — `--if` conditional (`src/modes/batch/executeIf.ts`)

```typescript
import { Host } from '../../platform/index.js';

export const executeIf = (condition: string): boolean => {
  const { punyexpr } = require('punyexpr');  // or import if ESM-compatible
  return !!punyexpr(condition)({
    ...Host.env,
    NODE_MAJOR_VERSION: parseInt(process.version.match(/v(\d+)\./)?.[1] ?? '0', 10)
  });
};
```

Called in `cli.ts` before dispatching to the mode function:

```typescript
if (configuration.if && !executeIf(configuration.if)) {
  logger.warn({ source: 'job', message: '⚠️ [SKIPIF] Skipping execution (--if)' });
  return;
}
```

> Check whether `punyexpr` is already a dependency; add it if not.

---

### Step 11 — `UI5TR_BATCH_MODE` detection in `cli.ts`

When `Host.env['UI5TR_BATCH_MODE']` is set, log the `[BATCHM]` warning:

```typescript
if (Host.env['UI5TR_BATCH_MODE']) {
  logger.warn({ source: 'job', message: '⚠️ [BATCHM] Batch mode item execution' });
}
```

---

### Step 12 — Unit tests

| File | What to test |
|---|---|
| `resolve.spec.ts` | folder item; config file with batchId/batchLabel override; config file fallback id=basename, label=basename; invalid JSON → warn; non-JSON file → warn; regex matching dirs and files; regex no-match → warn; invalid regex → warn; Windows path normalization |
| `task.spec.ts` | `UI5TR_BATCH_MODE=1` injected into child env; `--report-dir` override when CLI-sourced; forwarding of `batchForwarded` options (scalar, variadic, negate); success path (log ✔️); failure path (log ❌, increment failed count) |
| `index.spec.ts` (batch) | empty spec → warn; items resolved → parallelize called; failed items → Exit.code = -1 |

All tests must use `vi.mock(import('../../platform/mock.js'))` — never mock `node:*` directly.

---

## Files Changed / Created

| File | Action |
|---|---|
| `docs/options/batch.md` | Create |
| `docs/options/if.md` | Create |
| `src/configuration/options.ts` | Regenerate via `npm run build:options` |
| `src/configuration/Configuration.ts` | Add `sources` field |
| `src/configuration/CommandLine.ts` | Populate `sources` with `'cli'` for explicit argv keys |
| `src/configuration/ConfigurationValidator.ts` | Add `batch` to `computeMode()`; force `outputInterval=1000` when `UI5TR_BATCH_MODE` is set; populate `sources` with `'config'` for config-file keys |
| `src/platform/FileSystem.ts` | Add `readdir` |
| `src/platform/Process.ts` | Extend `spawn()` with `onMessage` / IPC support |
| `src/platform/mock.ts` | Mock new `FileSystem.readdir` and updated `Process.spawn` |
| `src/modes/Modes.ts` | Already has `batch` — no change needed |
| `src/modes/execute.ts` | Wire `Modes.batch → batch` |
| `src/cli.ts` | Add `UI5TR_BATCH_MODE` warning + `--if` evaluation |
| `src/modes/batch/BatchItem.ts` | Create |
| `src/modes/batch/resolve.ts` | Create |
| `src/modes/batch/task.ts` | Create |
| `src/modes/batch/executeIf.ts` | Create |
| `src/modes/batch/index.ts` | Create |
| `src/modes/batch/resolve.spec.ts` | Create |
| `src/modes/batch/task.spec.ts` | Create |
| `src/modes/batch/index.spec.ts` | Create |

---

## Commit Sequence

Each commit is a single logical change:

1. `feat(configuration): add sources tracking to Configuration, CommandLine and ConfigurationValidator`
2. `feat(options): add batch and if options`
3. `feat(configuration): detect batch mode; force outputInterval when UI5TR_BATCH_MODE`
4. `feat(platform): add FileSystem.readdir and Process.spawn IPC support`
5. `feat(batch): implement BatchItem, resolve helpers`
6. `feat(batch): implement task() child process runner`
7. `feat(batch): implement batch() orchestration + executeIf`
8. `feat(cli): add UI5TR_BATCH_MODE warning and --if evaluation`
9. `feat(execute): wire batch mode function`
10. `test(batch): full unit test coverage`

---

## Dependencies

- `punyexpr` — needed for `--if` expression evaluation. Verify it is already in `package.json`; add if absent.
