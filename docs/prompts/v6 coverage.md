# Coverage — v6 Implementation Plan

## Dependency strategy

`nyc` is loaded once via `Npm.import('nyc')`. All istanbul sub-packages (`istanbul-lib-instrument`,
`istanbul-lib-coverage`, `istanbul-lib-report`, `istanbul-reports`) are bundled inside nyc's own
`node_modules` and resolved from there — no new entries in `package.json`.

`src/modes/test/coverage/nyc.ts` handles the dynamic import and sub-package resolution:

1. Call `Npm.import('nyc')` to trigger install if needed and get the nyc module object.
2. Resolve nyc's install path: use `Module.createRequire` pointed at nyc's `package.json` to
   obtain a require function rooted in nyc's directory.
3. Use that require to resolve and import `istanbul-lib-instrument`, `istanbul-lib-coverage`,
   `istanbul-lib-report`, and `istanbul-reports`.

The resolved factories are returned as typed objects and cached (memoized).

---

## New options (9 option doc files → `make options`)

| Option | Type | Default | Notes |
|---|---|---|---|
| `coverage` | `boolean` | `false` | Always opt-in; must be set explicitly |
| `coverageTempDir` | `fs-entry` (overwrite) | `'.nyc_output'` | Per-run scratch; wiped at start |
| `coverageReportDir` | `fs-entry` (overwrite) | `'coverage'` | Wiped before report generation |
| `coverageSettings` | `fs-entry` (safe-default) | `'.nycrc.json'` | Project Istanbul config; optional |
| `coverageReporters` | `string` (multiple) | `['lcov','cobertura']` | `text` is always appended if absent |
| `coverageCheckBranches` | `percent` | `0` | 0 = no check |
| `coverageCheckFunctions` | `percent` | `0` | 0 = no check |
| `coverageCheckLines` | `percent` | `0` | 0 = no check |
| `coverageCheckStatements` | `percent` | `0` | 0 = no check |

The `percent` validator already exists (`src/configuration/validators/percent.ts`).

---

## New files

```
docs/options/
  coverage.md
  coverageTempDir.md
  coverageReportDir.md
  coverageSettings.md
  coverageReporters.md
  coverageCheckBranches.md
  coverageCheckFunctions.md
  coverageCheckLines.md
  coverageCheckStatements.md

src/modes/test/coverage/
  index.ts        — public surface: instrument(), collect(), generateReport()
  nyc.ts          — Npm.import('nyc'), resolves and re-exports istanbul sub-package factories
  settings.ts     — reads .nycrc.json, augments, writes augmented copy, returns IstanbulSettings
  instrument.ts   — walks webapp/, instruments .js files into coverageTempDir/instrumented/
  collect.ts      — receives window.__coverage__, writes <hash>_<index>.json to coverageTempDir
  allIndex.ts     — builds the all-index (zero-hit entries for files never loaded)
  report.ts       — merges JSON files, runs reporters, checks thresholds
  types.ts        — CoverageData, IstanbulSettings interfaces
```

---

## Changes to existing files

### `src/agent/window.d.ts`

Add `coverage?: unknown` to the `window['ui5-test-runner']` shape so the agent can store
`window.__coverage__` there after tests complete, and `pageTask` can read it via `page.eval`.

### `src/agent/qunit.ts`

In the `done()` inner function (called from `QUnit.done`), after `updateState({ done: true })`,
write coverage into the agent namespace:

```typescript
if (window.__coverage__) {
  window[UI5_TEST_RUNNER].coverage = window.__coverage__;
}
```

This keeps all agent output in one place and is consistent with how `results` and `state` are
exposed.

### `src/modes/test/agent.ts`

Add a parallel `getCoverageAgentSource()` (memoized, reads `ui5-coverage.js` from the dist/ui
folder alongside `agent.js`). `ui5-coverage.js` is injected as a separate script, not bundled
into `agent.js`, so it can be conditionally omitted.

### `src/modes/test/pageTask.ts`

When `configuration.coverage`:

- Inject `getCoverageAgentSource()` into the `scripts` array passed to `browser.newWindow`.
  (`opaIframeCoverage` is already in `agent.js` unconditionally — no change needed there.)
- After `queryAgentState` returns `true` (page done), read coverage via:
  ```typescript
  const coverageData = await page.eval("window['ui5-test-runner'].coverage");
  if (coverageData) await collect(configuration, url, coverageData);
  ```
  This sits alongside the existing `testResults` read.

### `src/modes/test/REserve.ts`

When `configuration.coverage`, insert a coverage mapping **before** the webapp project mapping:

```typescript
{
  match: /(.*\.js)(\?.*)?$/,
  cwd: path.join(configuration.coverageTempDir, 'instrumented'),
  file: '$1'
}
```

The `(\?.*)?$` group makes `?instrument=true` (appended by `ui5-coverage.js`) harmless — `$1`
captures only the path.

### `src/modes/test/index.ts`

1. Before `server.start()`: `if (configuration.coverage) await instrument(configuration)`
2. After `parallelize()` completes, before `saveReport()`:
   `if (configuration.coverage) await generateReport(configuration)`

---

## Phase detail

### settings.ts

1. Try to read `configuration.coverageSettings` (`.nycrc.json`). If absent, start from `{}`.
2. Augment:
   - `all: true`, `sourceMap: false`
   - Append to `exclude`: `coverageTempDir/**`, `coverageReportDir/**`, `reportDir/**`
   - Set `cwd` to `configuration.webapp`
3. Write the augmented object to `<coverageTempDir>/settings/.nycrc.json`.
4. Return the live `IstanbulSettings` object (kept in module scope so `report.ts` can reuse it).

### instrument.ts

1. `Folder.recreate(coverageTempDir)` — wipes everything from any previous run.
2. `Folder.create(path.join(coverageTempDir, 'settings'))` — for the settings file.
3. Call `settings.ts` to write `settings/.nycrc.json`.
4. Recursively walk `configuration.webapp` for `.js` files using `FileSystem.readdir`.
5. For each file: read → `instrumenter.instrumentSync(code, absoluteFilePath)` with options
   `{ coverageGlobalScope: 'window.top', coverageGlobalScopeFunc: false, produceSourceMap: false }`.
   The `coverageGlobalScope` option bakes `window.top` directly into the output — no post-processing
   patch needed.
6. Write instrumented output to `<coverageTempDir>/instrumented/<relative-path>`, creating
   intermediate directories as needed.

### collect.ts

Module-local counter `coverageFileIndex` (incremented per call) prevents filename collisions when
the same URL runs more than once (retries, parallel runs).

```typescript
const fileName = `${hashUrl(url)}_${++coverageFileIndex}.json`;
await FileSystem.writeFile(path.join(configuration.coverageTempDir, fileName), JSON.stringify(data));
```

`hashUrl` produces a filesystem-safe string from the URL (same approach as v5: replace non-alphanumeric
characters).

### allIndex.ts

Called from `report.ts` when `nycSettings.all === true`.

Walks `<coverageTempDir>/instrumented/` recursively. For each `.js` file:

1. Read the file content.
2. Extract the embedded coverage data object with:
   ```
   source.match(/coverageData\s*=\s*({[^;]*});/)
   ```
3. Normalise: add double-quotes around unquoted property names, handle `undefined` values
   (replace with a sentinel string, parse, then replace sentinel back with `undefined`).
4. The result is an entry `{ [filePath]: zeroCoverageData }` where all hit counters (`s`, `b`, `f`)
   are already zero as emitted by the instrumenter.

Write the merged object to `<coverageTempDir>/all-index.json`.

### report.ts

1. `Folder.recreate(coverageReportDir)`.
2. Build all-index if `nycSettings.all`: call `buildAllIndex()`, load from
   `<coverageTempDir>/all-index.json` into a `CoverageMap`.
3. Read all `*.json` files from `coverageTempDir` (excluding `all-index.json` and
   `settings/`), parse each, and merge into the `CoverageMap` via `coverageMap.addFileCoverage()`.
4. Build reporter context:
   ```typescript
   const context = libReport.createContext({
     dir: configuration.coverageReportDir,
     coverageMap
   });
   ```
5. Determine reporters: `[...configuration.coverageReporters]`, always append `'text'` if absent.
6. For each reporter name: `reports.create(name).execute(context)`.
7. **Threshold check**: call `coverageMap.getCoverageSummary()` which returns totals for
   `statements`, `branches`, `functions`, `lines`. For each dimension where the configured
   threshold is `> 0`, compare `summary[dim].pct` against the threshold. If any check fails:
   - `logger.error` naming the dimension, actual pct, and required threshold
   - `Exit.code = -1`

---

## Deferred

- Remote/url mode coverage (proxy, remote scanner, `$remoteOnLegacy` equivalent)
- TypeScript source map support
- Batch-mode per-item `coverageTempDir` isolation
