# Coverage — Implementation Reference

This document describes how code coverage is collected, transported, and merged in ui5-test-runner v5. It is intended as a reference for re-implementing the feature in a new version.

---

## 1. Overview

Coverage is powered entirely by **nyc** (Istanbul v2 CLI). The process has three phases:

1. **Instrumentation** — source files are transformed to inject Istanbul counters before the browser loads them.
2. **Collection** — after each test page finishes, the browser's `window.__coverage__` object is POSTed back to the runner and written to a JSON file.
3. **Merge + Report** — once all pages are done, all per-page JSON files are merged by `nyc merge`, then `nyc report` generates the final HTML/LCOV/Cobertura output.

The exact approach differs across three modes: **legacy**, **url/remote** (with a local webapp mapping), and **url/remote** (no local mapping — true remote).

---

## 2. Configuration

### 2.1 Job properties

| Property | Default | Purpose |
|---|---|---|
| `coverage` | `false` in url mode, otherwise opt-in | Master switch |
| `coverageSettings` | `$/.nycrc.json` | Path to `.nycrc.json` for nyc |
| `coverageTempDir` | `.nyc_output` (relative to cwd) | Stores raw per-page JSON + instrumented sources |
| `coverageReportDir` | `coverage` (relative to cwd) | Final HTML/LCOV/Cobertura output |
| `coverageReporters` | `['lcov', 'cobertura']` | Reporters to pass to `nyc report` |
| `coverageCheckBranches/Functions/Lines/Statements` | `0` | Thresholds; `0` means no check |
| `coverageRemoteScanner` | `$/scan-ui5.js` | Module for scanning remote files for `all` coverage |
| `coverageProxy` | `false` | Experimental: on-the-fly instrumentation via an HTTP proxy |
| `coverageProxyInclude` | `.*` | Regex: which URLs to instrument via proxy |
| `coverageProxyExclude` | `/((test-)?resources\|tests?)/` | Regex: which URLs to skip in proxy mode |

### 2.2 nyc settings

UTR reads the project's `.nycrc.json` (pointed to by `coverageSettings`), then **augments** it at startup:

```json
{
  "all": true,
  "sourceMap": false
}
```

UTR adds to `settings.exclude` automatically:
- `<coverageTempDir>/**`
- `<cache>/**` (if caching is enabled)
- `<reportDir>/**` — the test report folder (not the coverage folder)
- `<coverageReportDir>/**`

It also sets `settings.cwd` to `job.webapp` (for local modes) or to the computed common ancestor of all source files (for remote modes where sources are downloaded).

The augmented settings are written to `<coverageTempDir>/settings/.nycrc.json` and all nyc invocations use `--nycrc-path` pointing to this file. The live object is stored on `job.nycSettings` so it can be rewritten later (e.g. when remote source paths are resolved).

### 2.3 In url mode, coverage is off by default

```js
// job.js finalize()
if (job.mode === 'url') {
  if (job[$valueSources].coverage !== 'cli') {
    job.coverage = false
  }
}
```

Coverage in url mode only activates if the user explicitly passes `--coverage` on the command line.

---

## 3. Execution Modes and the `$remoteOnLegacy` flag

The mode is set on `job.mode` by `buildAndCheckMode()` (`src/job-mode.js`):

- **`legacy`** — no `--url` given; UTR serves the webapp itself.
- **`url`** — `--url` given; UTR drives an external server.
- **`batch`** / **`capabilities`** — not relevant for coverage.

There is a special case called **remote-on-legacy**: when `mode === 'url'` but the URLs point to UTR's own port (port `0` in the config = UTR's dynamically assigned port). In `job.js finalize()`:

```js
if (job.mode === 'url') {
  job[$remoteOnLegacy] = job.url && job.url.every(url => {
    const parsedUrl = new URL(url)
    return parsedUrl.port === port  // UTR's own port
  })
}
```

When `$remoteOnLegacy` is true, coverage behaves exactly like `legacy` mode — UTR instruments locally and serves the instrumented files. This is the scenario: "I own the server, I just use `--url` instead of `--testsuite`."

---

## 4. Phase 1: Instrumentation (`src/coverage.js → instrument()`)

Called from `src/tests.js → process()` before test execution starts:

```js
await instrument(job)
```

### 4.0 `coverageTempDir` is wiped at startup

`instrument()` always begins with:

```js
await cleanDir(job.coverageTempDir)
await createDir(join(job.coverageTempDir, 'settings'))
```

This deletes the entire temp directory (instrumented sources, per-page JSON files, `all-index.json`, everything) before writing the settings file and running instrumentation. Any stale data from a previous run is gone. The report directory is **not** wiped here — that happens later in `generateCoverageReport()`.

### 4.1 Legacy mode and remote-on-legacy

```
nyc instrument <webapp> <coverageTempDir>/instrumented --nycrc-path <settings>
```

This is a full offline instrumentation run via `child_process.fork` of `nyc/bin/nyc.js`. All `.js` files under `job.webapp` are rewritten with Istanbul counters into `<coverageTempDir>/instrumented/`.

The instrumented files are then **served** through a REserve mapping (see §6).

### 4.2 Pure url/remote mode (no `$remoteOnLegacy`)

No instrumentation happens at startup. Instead `job[$coverageRemote] = true` is set and `output.instrumentationSkipped()` is logged.

Instrumentation is deferred: either the remote server is already running a coverage-aware build (e.g. `@ui5/middleware-code-coverage`), or UTR instruments on-the-fly via the **coverage proxy** (see §5.3).

---

## 5. Phase 2: Serving Instrumented Files — The REserve Mappings

`src/reserve.js` assembles the REserve server configuration. Coverage contributes mappings from `coverage.mappings(job)` (an async function in `src/coverage.js`). These mappings are inserted **before** the project's own file mapping and **after** the endpoint mappings.

The full mapping order in `src/reserve.js`:
```
[cors, ...job.mappings, ...endpoints(job), ...ui5(job), ...coverage(job), projectMapping, ...unhandled(job)]
```

### 5.1 Legacy / remote-on-legacy: single file mapping with custom file system

```js
return [{
  match: /(.*\.js)(\?.*)?$/,
  cwd: instrumentedBasePath,    // <coverageTempDir>/instrumented
  file: '$1',
  'custom-file-system': customFileSystem  // unless --debug-coverage-no-custom-fs
}]
```

The `match` catches any `.js` request (ignoring query string). REserve resolves `$1` relative to `instrumentedBasePath` (`<coverageTempDir>/instrumented`), effectively substituting every JS request with its pre-instrumented copy.

#### The custom file system (`customFileSystem`)

Istanbul's instrumentation adds a `global=new Function("return this")()` call to find the global scope. In browsers, `new Function("return this")()` returns `undefined` in strict mode. The custom file system patches this at **read time** to use `window.top` instead, which works correctly both in the main page and inside OPA iframes.

```js
const globalContextSearch = 'var global=new Function("return this")();'
const globalContextReplace = 'var global=window.top;'

const customFileSystem = {
  stat: path => stat(path).then(stats => {
    // Adjust reported size because we replace one string with a shorter one
    stats.size -= globalContextSearch.length + globalContextReplace.length
    return stats
  }),
  readdir,
  createReadStream: async (path) => {
    const buffer = (await readFile(path))
      .toString()
      .replace(globalContextSearch, globalContextReplace)
    return Readable.from(buffer)
  }
}
```

REserve's file handler calls `stat` to set `Content-Length` and `createReadStream` to produce the body. Both are intercepted to transparently apply the patch. The `--debug-coverage-no-custom-fs` flag disables this for debugging.

### 5.2 Pure url/remote without proxy: no mappings returned

```js
// coverage.mappings() returns []
return []
```

The browser loads JS files directly from the remote server. Coverage data must be embedded in those files by the remote server's own middleware (e.g. `@ui5/middleware-code-coverage` which appends `?instrument=true` handling). The browser's `window.__coverage__` is still collected via the QUnit hook (see §6).

### 5.3 url/remote with `--coverage-proxy` (experimental)

This is an on-the-fly proxy that instruments JS files as they are requested. Three mappings are returned:

#### Mapping 1: On-the-fly instrumentation (custom handler)

```js
{
  match: /(.*\.js)(\?.*)?$/,
  custom: async (request, response, url) => {
    if (!url.match(job.coverageProxyInclude) || url.match(job.coverageProxyExclude)) {
      return  // skip — let REserve fall through to next mapping
    }
    const instrumentedSourcePath = join(instrumentedBasePath, url)
    // If already instrumented, skip (fall through to mapping 2)
    try { await access(instrumentedSourcePath); return } catch (e) {}
    // Deduplicate concurrent requests for the same URL
    if (!sources[url]) {
      sources[url] = (async () => {
        const sourcePath = await getReadableSource(job, url)
        const source = (await readFile(sourcePath)).toString()
        const instrumentedSource = await instrument(source, sourcePath)
        await createDir(dirname(instrumentedSourcePath))
        await writeFile(instrumentedSourcePath, instrumentedSource)
        delete sources[url]
      })()
    }
    await sources[url]
    // Returns undefined → REserve falls through to mapping 2
  }
}
```

When this custom handler returns `undefined` (no response written), REserve falls through to the next mapping.

#### Mapping 2: Serve the cached instrumented file

```js
{
  match: /(.*\.js)(\?.*)?$/,
  cwd: instrumentedBasePath,   // <coverageTempDir>/instrumented
  file: '$1'
}
```

This serves the file written by mapping 1, or falls through if not found.

#### Mapping 3: Proxy to origin

```js
{
  match: /(.*)$/,
  url: `${origin}$1`   // forwards to e.g. https://ui5.sap.com$1
}
```

All unmatched requests (non-JS, or JS files that aren't instrumented) are forwarded to the remote origin.

#### Instrumenter construction

UTR tries two APIs in order (handling nyc version differences):

```js
// Newer nyc: istanbul-lib-instrument directly
const { createInstrumenter } = require('istanbul-lib-instrument')
const instrumenter = createInstrumenter({
  produceSourceMap: true,
  coverageGlobalScope: 'window.top',
  coverageGlobalScopeFunc: false
})
instrument = promisify(instrumenter.instrument.bind(instrumenter))

// Older nyc: lib/instrumenters/istanbul.js
const createInstrumenter = require('nyc/lib/instrumenters/istanbul.js')
instrument = async (code, sourcePath) =>
  instrumenter.instrumentSync(code, sourcePath, { registerMap: () => {} })
    .replace(globalContextSearch, globalContextReplace)
```

Note that the "older" path applies the same `window.top` patch via string replacement, since `coverageGlobalScope` is not available.

#### URL proxification in tests.js

When `coverageProxy` is active, test page URLs are rewritten so the browser navigates through UTR's local port instead of directly to the remote origin:

```js
// src/tests.js → runTestPage()
if (job.coverageProxy) {
  const { origin } = new URL(url)
  const proxifiedUrl = url.replace(origin, `http://localhost:${job.port}`)
  job[$proxifiedUrls][proxifiedUrl] = url
  await start(job, proxifiedUrl, scripts)
  // After completion, re-key qunitPages back to the original URL
  job.qunitPages[url] = job.qunitPages[proxifiedUrl]
  delete job.qunitPages[proxifiedUrl]
}
```

This ensures all JS requests from the browser flow through REserve's proxy mapping, enabling on-the-fly instrumentation.

---

## 6. Browser-Side Coverage: Injection and Collection

### 6.1 `window.__coverage__`

Istanbul instruments code so every instrumented file registers itself in `window.__coverage__`. After all tests run, this object is a map of `{ [filePath]: CoverageData }` where `CoverageData` contains statement/branch/function hit counts and location maps.

### 6.2 Injected scripts (`src/tests.js → runTestPage()`)

When `coverage` is enabled and `coverageProxy` is false, two scripts are injected into every test page:

```js
scripts.push(
  'opa-iframe-coverage.js',
  'ui5-coverage.js'
)
```

#### `src/inject/opa-iframe-coverage.js`

OPA5 tests run in an iframe. By default, each iframe has its own `window.__coverage__`. This script makes the iframe's `__coverage__` delegate to `window.top.__coverage__`:

```js
if (window !== window.top || window !== window.parent) {
  Object.defineProperty(window, '__coverage__', {
    get () { return window.top.__coverage__ },
    set (value) { window.top.__coverage__ = value; return true }
  })
}
```

This ensures coverage data from OPA pages is accumulated in the top-level window, where the QUnit hook can read it.

#### `src/inject/ui5-coverage.js`

UI5's module loader (`ui5loader.js`) loads modules via `<script data-sap-ui-module>` tags and `XMLHttpRequest`. This script intercepts both to append `?instrument=true` to every `.js` URL, triggering UTR's coverage mapping:

```js
// Intercept setAttribute on script elements
HTMLScriptElement.prototype.setAttribute = function (name, value) {
  if (name === 'data-sap-ui-module') {
    this.src = appendUrlParameter(this.src)  // adds ?instrument=true
  }
  nativeSetAttribute.apply(this, arguments)
}

// Intercept XHR (older UI5 loader)
XMLHttpRequest.prototype.open = function (method, url) {
  if (window.sap && window.sap.ui && window.sap.ui.loader && url && url.endsWith('.js')) {
    arguments[1] = appendUrlParameter(url)
  }
  nativeXhrOpen.apply(this, arguments)
}
```

REserve's coverage mapping matches `/(.*\.js)(\?.*)?$/` — the `(\?.*)` group makes `?instrument=true` harmless for file resolution (`$1` captures only the path).

### 6.3 QUnit done hook (`src/inject/qunit-hooks.js`)

When all QUnit tests finish, `QUnit.done` fires:

```js
QUnit.done(function (report) {
  if (window.__coverage__) {
    report.__coverage__ = window.__coverage__
  }
  return post('QUnit/done', report)
})
```

`window.__coverage__` is attached to the report object and POSTed to `/_/QUnit/done`.

### 6.4 Server-side collection (`src/qunit-hooks.js → done()`)

The `done` endpoint handler:

```js
async function done (job, urlWithHash, report) {
  // ...
  if (report.__coverage__) {
    await collect(job, url, report.__coverage__)
    delete report.__coverage__
  } else if (job.coverage) {
    getOutput(job).coverageNotFound()
  }
  // ...
}
```

`collect()` is imported from `src/coverage.js`:

```js
async collect (job, url, coverageData) {
  if (!job.coverage) return
  job[$coverageFileIndex] = (job[$coverageFileIndex] || 0) + 1
  const coverageFileName = join(
    job.coverageTempDir,
    `${filename(url)}_${job[$coverageFileIndex]}.json`
  )
  await writeFile(coverageFileName, JSON.stringify(coverageData))
}
```

Each page produces one JSON file named `<hash-of-url>_<index>.json` in `coverageTempDir`. The index prevents collisions when the same URL is run multiple times (parallel execution, retries).

---

## 7. Phase 3: Merge and Report (`src/coverage.js → generateCoverageReport()`)

Called from `src/report.js → generate()` after all test pages complete.

> **Note**: `generateCoverageReport()` begins with `cleanDir(job.coverageReportDir)`. Any output from a previous run is deleted before the new report is written.

### 7.1 Optional "all" coverage index

If `job.nycSettings.all === true` (the default in `src/defaults/.nycrc.json`), UTR builds an index of all source files so nyc can report 0% for files never loaded by any test.

```js
if (job.nycSettings.all) {
  await buildAllIndex(job)
}
```

#### `buildAllIndex()`

Scans all instrumented source files to extract their embedded `coverageData` object. The scanner differs by mode:

| Mode | Scanner | Starting point |
|---|---|---|
| legacy or remoteOnLegacy | `scanFs` (local filesystem traversal) | `<coverageTempDir>/instrumented` |
| url/remote | `require(job.coverageRemoteScanner)` | `getUrlOrigin(job)` (e.g. `http://localhost:8080`) |

**`scanFs`**: Recursively walks the directory tree calling `onFolder(count)` and `onFile(path, content)`.

**`scan-ui5.js`** (default remote scanner): Fetches the directory listing HTML from the UI5 server, parses anchor tags, and recursively fetches files. For `.ts` files it fetches the compiled `.js` equivalent; for `.js` files it appends `?instrument=true` to get the instrumented version from the server.

In both cases, each source file is expected to contain a line like:
```js
var coverageData = {path: "...", statementMap: {...}, ...};
```

The regex extracts this object:
```js
const coverageData = source
  .match(/coverageData\s*=\s*({[^;]*});/)[1]
  .replace(/([^"])(\w+):/g, (_, before, name) => `${before}"${name}":`)
```

The second replace adds double quotes around unquoted property names (Istanbul uses unquoted names in older versions). Then `undefined` values are handled:
```js
const UNDEFINED = '__undefined__'
const validatedCoverageData = JSON.stringify(
  JSON.parse(coverageData.replace(/\bundefined\b/g, `"${UNDEFINED}"`)),
  (key, value) => value === UNDEFINED ? undefined : value
)
```

The resulting index is written to `<coverageTempDir>/all-index.json` as:
```json
{ "/path/to/file.js": { "path": "...", "s": {}, "b": {}, "f": {}, ... }, ... }
```

### 7.2 nyc merge

```js
await safeNyc(job, 'merge', job.coverageTempDir, coverageFilename)
```

Runs `nyc merge <coverageTempDir> <merged>/coverage.json`. This reads all `.json` files in `coverageTempDir` (the per-page collection files plus `all-index.json`) and merges them into a single `coverage.json`.

### 7.3 Remote source resolution (`checkAllSourcesAreAvailable`)

Only runs when `job[$coverageRemote]` is true (pure url/remote mode without `$remoteOnLegacy`).

After merge, the merged `coverage.json` contains file paths as they were reported by Istanbul — typically URL paths like `/controller/App.controller.js`. These need to be resolved to actual local paths so nyc can read the source for HTML reports.

```js
async function getReadableSource (job, pathOrUrl) {
  // 1. Try as absolute local path
  // 2. Try relative to job.webapp
  // 3. Download from remote origin → job.coverageSourceDir (<coverageTempDir>/sources)
}
```

For each file in the merged coverage:
- If the path changed (downloaded), update `fileData.path` and re-key `coverageData[newPath]`
- Compute the common ancestor directory of all sources using this exact algorithm:
  ```
  basePath = undefined
  for each resolved filePath:
    fileFolder = dirname(filePath)
    if basePath is undefined:
      basePath = fileFolder
    else:
      diff = relative(basePath, fileFolder).split(sep)
      // Walk up basePath for each leading ".." in the relative path
      while diff.shift() === '..':
        basePath = dirname(basePath)
  ```
  This progressively shrinks `basePath` upward to the deepest folder that is an ancestor of all resolved source paths. It is NOT a simple string prefix: it uses OS path resolution and walks upward segment by segment.
- Set `job.nycSettings.cwd = basePath` and rewrite the settings file

This dynamic `cwd` update is crucial: nyc uses it as the root for relative path display in reports. When sources are downloaded to `<coverageTempDir>/sources`, the cwd must point there.

### 7.4 nyc report

```js
const reporters = job.coverageReporters.map(r => `--reporter=${r}`)
// text is always added if not already present
if (!job.coverageReporters.includes('text')) reporters.push('--reporter=text')

const checks = []
if (/* any threshold set */) {
  reporters.push('--reporter=lcov')  // needed for size check
  checks.push(`--branches=${job.coverageCheckBranches}`, ..., '--check-coverage')
}

await nyc(job, 'report', ...reporters, ...checks,
  '--temp-dir', coverageMergedDir,
  '--report-dir', job.coverageReportDir,
  '--nycrc-path', job[$nycSettingsPath])
```

If checks are enabled, UTR verifies that `lcov.info` is non-empty (empty = no coverage data = checks were silently skipped by nyc). If nyc exits with code 1, it means thresholds were not met → `job.failed = true`.

---

## 8. TypeScript support

The TS `.nycrc.json` uses:
```json
{ "all": true, "sourceMap": false, "exclude": ["**/test/**/*.ts"] }
```

The `.ts` extension is in the `exclude` list for test files, not source files. The compiled `.js` files served by the remote server are instrumented normally. The `scan-ui5.js` scanner handles `.ts` file entries specially:

```js
} else if (item.endsWith('.ts')) {
  // Fetch the .js equivalent for the instrumented source
  await onFile(itemUrl, await (await fetch(itemUrl.replace(/\.ts$/, '.js'))).text())
}
```

The `coveragePath` inside the instrumented `.js` for a `.ts` file points to the `.ts` source, so the coverage report correctly references the TypeScript source.

---

## 9. Complete Flow by Scenario

### 9.1 Legacy mode (`JS_LEGACY_COVERAGE`)

```
startup:
  instrument(job)
    → nyc instrument webapp/ .nyc_output/instrumented/

REserve mappings:
  /(.*\.js)(\?.*)?$/ → cwd=.nyc_output/instrumented, file=$1, custom-file-system

browser loads test page:
  request: /controller/App.controller.js?instrument=true
    → matched by coverage mapping
    → served from .nyc_output/instrumented/controller/App.controller.js
    → custom-file-system patches var global=new Function(...)()

QUnit.done:
  window.__coverage__ → POST /_/QUnit/done

collect():
  → writes .nyc_output/<hash>_1.json

generateCoverageReport():
  buildAllIndex() → scans .nyc_output/instrumented/, writes .nyc_output/all-index.json
  nyc merge .nyc_output/ .nyc_output/merged/coverage.json
  nyc report --reporter=lcov --reporter=cobertura --temp-dir merged/ --report-dir coverage/
```

### 9.2 Remote mode, local mapping (`JS_LEGACY_REMOTE_COVERAGE`, `JS_REMOTE_COVERAGE_MAPPED`)

Identical to legacy. The `$remoteOnLegacy` flag is true because `--url http://localhost:0/...` resolves to UTR's own port. UTR instruments locally and serves from `.nyc_output/instrumented/`.

### 9.3 Remote mode, no local mapping (`JS_REMOTE_COVERAGE`, `TS_REMOTE_COVERAGE`)

```
startup:
  instrument(job):
    job[$coverageRemote] = true
    → skips nyc instrument
    → writes only .nycrc.json settings

REserve mappings: [] (empty — no coverage mappings)

browser loads test page from remote server (e.g. http://localhost:8080):
  remote server already serves files with ?instrument=true support
  (ui5-coverage.js injection still adds ?instrument=true to all module loads)

QUnit.done:
  window.__coverage__ → POST /_/QUnit/done

collect():
  → writes .nyc_output/<hash>_1.json
  (paths inside coverage data are remote URL paths like /controller/App.js)

generateCoverageReport():
  nyc merge .nyc_output/ .nyc_output/merged/coverage.json
  checkAllSourcesAreAvailable():
    for each file path in merged coverage.json:
      getReadableSource() tries:
        1. absolute path (fails — it's a URL path)
        2. join(job.webapp, path) → succeeds if cwd points to a local checkout
           OR
        3. download from origin to .nyc_output/sources/
      rewrite fileData.path to the resolved local path
      recompute cwd = common ancestor of all source paths
    rewrite .nycrc.json with new cwd
  nyc report --reporter=lcov ... --temp-dir merged/ --report-dir coverage/
```

The `nycSettings.cwd` ends up at `job.webapp` when a local mapping is provided (e.g. `JS_REMOTE_COVERAGE_MAPPED`), or at `<coverageTempDir>/sources/<deepest-common-path>` when sources were downloaded (e.g. `JS_REMOTE_COVERAGE`).

### 9.4 Coverage proxy (`JS_REMOTE_UI5_SAMPLE_COVERAGE`)

```
startup:
  instrument(job):
    job[$coverageRemote] = true
    → skips nyc instrument

REserve mappings:
  /(.*\.js)(\?.*)?$/ custom → check filter, instrument on demand to .nyc_output/instrumented/
  /(.*\.js)(\?.*)?$/ → cwd=.nyc_output/instrumented, file=$1
  /(.*)$/            → url=https://ui5.sap.com$1  (proxy)

browser navigates to proxified URL:
  http://localhost:<port>/test-resources/...
    → mapped through REserve
    → JS files: instrumented on first request, cached for subsequent requests
    → non-JS / excluded files: proxied to origin

QUnit.done → collect() → generateCoverageReport() (as in §9.3)
```

---

## 10. nyc invocation details

All nyc calls use `child_process.fork` of `nyc/bin/nyc.js` (not `exec`), so stdio is piped and monitored by the output system. The nyc package path is resolved once via `resolvePackage(job, 'nyc')` and cached in module-level `nycInstallationPath`.

```js
async function nyc (job, ...args) {
  const childProcess = fork(nycScript, args, { stdio: 'pipe' })
  output.monitor(childProcess)
  const { promise, resolve } = allocPromise()
  childProcess.on('close', resolve)
  return promise  // resolves with exit code
}
```

`safeNyc` wraps this and throws `UTRError.NYC_FAILED` if the exit code is non-zero.

The three nyc commands used:
- `nyc instrument <src> <dest> --nycrc-path <path>` — offline instrumentation
- `nyc merge <dir> <output-file>` — merge per-page JSON files
- `nyc report --reporter=X ... --temp-dir <dir> --report-dir <dir> --nycrc-path <path>` — generate report

---

## 11. Key Symbols

| Symbol | Location | Purpose |
|---|---|---|
| `$nycSettingsPath` | `coverage.js` (private) | Path to the augmented `.nycrc.json` |
| `$coverageFileIndex` | `coverage.js` (private) | Counter for unique per-page JSON filenames |
| `$coverageRemote` | `coverage.js` (private) | True when in pure remote mode (skips instrumentation) |
| `$remoteOnLegacy` | `symbols.js` (shared) | True when `--url` points to UTR's own port |
| `$proxifiedUrls` | `symbols.js` (shared) | Maps proxified URLs → original URLs (proxy mode) |

---

## 12. Key invariants and edge cases

- **OPA iframes**: The `opa-iframe-coverage.js` injection makes every iframe share `window.top.__coverage__`. Without it, coverage from OPA page code would be silently dropped.

- **`?instrument=true` is the trigger**: `ui5-coverage.js` adds this to every UI5 module load. The REserve file mapping ignores query strings (`(\?.*)?$` in the regex). The remote server's `@ui5/middleware-code-coverage` also recognises this parameter.

- **`window.top` vs `new Function("return this")()`**: In strict mode (which all modern modules use), `new Function("return this")()` returns `undefined`. UTR patches the instrumented code at serve time (legacy) or at instrumentation time (proxy) to use `window.top` instead.

- **Deduplication of proxy requests**: The `sources[url]` promise is stored to prevent multiple concurrent instrumentations of the same file. Once written, `access()` short-circuits further requests.

- **`all` coverage**: The `all-index.json` file contains zero-hit coverage data for every source file. When `nyc merge` runs, it merges this with the actual per-page data, so files never loaded still appear in the report at 0%.

- **`cwd` is dynamic in remote mode**: After `checkAllSourcesAreAvailable`, the nyc settings file is rewritten with the correct `cwd`. If this is not done, nyc will look for source files relative to the wrong directory and the HTML report will be empty.

- **Coverage is disabled in url mode by default**: To prevent accidental activation against external servers. The user must explicitly pass `--coverage` on the CLI (`$valueSources.coverage === 'cli'`).

- **Batch mode**: Each batch item has its own `coverageTempDir` (using the `📂report` token which expands to the per-batch report dir). This prevents cross-contamination between batch items during merge.
