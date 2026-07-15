# Batch Mode — Implementation Reference

> This document is a complete reference for porting batch mode to the main branch.

---

## Overview

Batch mode allows `ui5-test-runner` to run multiple independent test projects in a single invocation. When `--batch` is provided, the process becomes the **main command**; each discovered test project becomes a **batch item** that runs as a forked child process.

Two separate concepts share the word "batch" in this codebase — they are entirely independent:

1. **Batch mode** (this document): process-level orchestration of multiple test projects
2. **QUnit batch size** (`--qunit-batch-size`): browser-side hook aggregation for performance — unrelated

---

## Files Involved

| File | Role |
|---|---|
| `src/batch.js` | Core: spec resolution, child process orchestration, progress tracking |
| `src/batch.spec.js` | Unit tests for `batch()` and `task()` |
| `src/if.js` | Evaluates `--if` conditional expressions via `punyexpr` |
| `src/if.spec.js` | Unit tests for `executeIf()` |
| `src/job.js` | Defines CLI options; `finalize()` sets `outputInterval=1000` in batch item children |
| `src/job-mode.js` | Returns `'batch'` mode when `job.batch` is set |
| `src/output.js` | `batchStartingTask`, `batchFailed`, `batchMode`, `skipIf` output methods; IPC progress send |
| `src/symbols.js` | Exports `$valueSources` symbol used for option forwarding |
| `src/tools.js` | `filename()` hash utility used as fallback `batchId` |
| `index.js` | Entry point: dispatches to `batch()`, logs `batchMode` warning, evaluates `--if` |

---

## CLI Options

Defined in `src/job.js` lines 173–178:

```js
// Batch mode related
.addOption(new Option('--batch-mode', '...', boolean).hideHelp())
.option('--batch <specification...>', 'Batch specification', arrayOf(string))
.option('--batch-id <id>', 'Batch id (used for naming report folder)', string)
.option('--batch-label <label>', 'Batch label (used while reporting on execution)', string)
.option('--if <condition>', 'Condition runner execution', string)
```

| Option | Type | Default | Description |
|---|---|---|---|
| `--batch <spec...>` | `arrayOf(string)` | — | One or more batch specifications (folder path, JSON file path, or regex). Activates batch mode. |
| `--batch-id <id>` | `string` | — | Used in JSON config files only. Sets the subfolder name under `--report-dir` and the progress display id. Fallback: SHA-256 hash of the path. |
| `--batch-label <label>` | `string` | — | Used in JSON config files only. Human-readable label shown in main command output. Fallback: the raw path string. |
| `--batch-mode` | `boolean` | `false` | Hidden option. Injected by the parent into each child process. Changes the way options are defaulted (in particular coverage temporary folders). |
| `--if <condition>` | `string` | — | Conditional expression. If present and evaluates falsy, the process exits without running. Used in JSON config files. |

`--batch-mode` is declared with `.hideHelp()` so it never appears in `--help` output.

---

## Mode Detection

`src/job-mode.js` (`buildAndCheckMode`):

```js
function buildAndCheckMode (job) {
  if (job.batch) {
    return 'batch'
  }
  // ...
}
```

`'batch'` is checked first — before `capabilities`, `url`, and `legacy` modes. When `job.batch` is set, no other mode checks run and no incompatible-option validation is performed.

`batchMode`, `batchId`, `batchLabel`, and `if` are explicitly listed in the `capabilities` allowed-options list (lines 41–45), so they are recognized as non-conflicting when running a capabilities check.

---

## `job` Object Fields

After CLI parsing and `finalize()`, the `job` object has these batch-relevant fields:

| Field | Type | Origin | Description |
|---|---|---|---|
| `job.batch` | `string[]` | `--batch` CLI arg | Specifications to resolve |
| `job.batchId` | `string \| undefined` | JSON config or `--batch-id` CLI | Identifier; used as subfolder name and display id |
| `job.batchLabel` | `string \| undefined` | JSON config or `--batch-label` CLI | Display label in output |
| `job.batchMode` | `boolean` | `--batch-mode` (injected by parent) | `true` if this is a batch item child |
| `job.batchItems` | `BatchItem[]` | Set in `batch()` | Array of resolved items to execute |
| `job.failed` | `number` → `boolean` | Set in `batch()` | Count of failed items; coerced to boolean at end |
| `job.if` | `string \| undefined` | `--if` CLI arg (in config file) | Conditional expression |

When `job.batchMode === true`, `finalize()` in `src/job.js` forces:
```js
if (job.batchMode) {
  job.outputInterval = 1000
}
```
This ensures child processes send IPC progress updates every 1000 ms.

---

## BatchItem Data Shape

Each resolved batch specification becomes a `BatchItem` object:

```js
{
  path: string,       // Absolute path (folder or config file)
  id: string,         // batchId from JSON, or filename() hash of path
  label: string,      // batchLabel from JSON, or the raw path string
  args: string[],     // Child process args: ['--cwd', path] or ['--config', path]
  start: Date,        // Set when task() starts the child
  end: Date,          // Set when child closes
  statusCode: number  // Exit code of the child process
}
```

The fallback `id` comes from `filename()` in `src/tools.js`:

```js
const filename = url => {
  const hash = createHash('shake256', { outputLength: 8 })
  hash.update(stripUrlHash(url))
  return hash.digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '_')
    .replace(/\//g, '$')
}
```

A SHAKE-256 hash of the path, 8 bytes, base64-encoded with URL-safe substitutions (`+` → `_`, `/` → `$`, `=` stripped).

---

## Core Logic: `src/batch.js`

### Option Forwarding Dictionary (`batchParameters`)

```js
const batchParameters = getCommand('.').options
  .filter(option => option.description.includes('📡'))
  .reduce((dictionary, option) => {
    dictionary[option.long.substring(2)] = option
    return dictionary
  }, {})
```

At module load, scans all CLI option definitions for the 📡 emoji. Those are the options that can be forwarded from the main command to child processes. The result maps `long-option-name` → option object.

Options flagged with 📡 include: `--page-timeout`, `--fail-fast`, `--fail-opa-fast`, `--log-server`, `--browser`, `--browser-args`, `--alternate-npm-path`, `--no-npm-install`, `--browser-close-timeout`, `--browser-retry`, `--output-interval`, `--offline`, `--env`, `--localhost`, `--ci`, `--deep-probe`, `--probe-parallel`, `--page-filter`, `--page-params`, `--page-close-timeout`, `--global-timeout`, `--screenshot` / `--no-screenshot`, `--screenshot-on-failure`, `--screenshot-timeout`, `--split-opa`, `--report-generator`, `--progress-page`, `--jest`, `--qunit-batch-size`, `--coverage` / `--no-coverage`, `--coverage-settings`, `--coverage-reporters`, `--coverage-check-*`, `--coverage-remote-scanner`, `--ui5`, `--disable-ui5`, `--libs`, `--mappings`, `--cache`, `--preload`.

### `folder()` helper

```js
const folder = (job, folderPath) => {
  job.batchItems.push({
    path: folderPath,
    id: filename(folderPath),
    label: folderPath,
    args: ['--cwd', folderPath]
  })
}
```

For a directory: fallback id (hash), fallback label (path), invoked with `--cwd <folderPath>`.

### `configurationFile()` helper

```js
const configurationFile = (job, configurationFilePath) => {
  try {
    const {
      batchId: id = filename(configurationFilePath),
      batchLabel: label = configurationFilePath
    } = require(configurationFilePath)
    job.batchItems.push({
      path: configurationFilePath,
      id,
      label,
      args: ['--config', configurationFilePath]
    })
  } catch (e) {
    getOutput(job).batchFailed(configurationFilePath, 'invalid JSON configuration file')
  }
}
```

`require()`s the JSON file to read `batchId` and `batchLabel`. Falls back to hash/path if absent. Invoked with `--config <configFilePath>`. If the file is not valid JSON, logs `⚠️ [BATCHF]` and skips.

### `batch()` — main orchestration

```js
async function batch (job) {
  job.start = new Date()
  job.failed = 0
  job.batchItems = []

  for (const batch of job.batch) {
    // 1. Try as a path (absolute or relative to job.cwd)
    try {
      let path = batch
      if (!isAbsolute(path)) path = join(job.cwd, path)
      const pathStat = await stat(path)
      if (pathStat.isDirectory())                              folder(job, path)
      else if (pathStat.isFile() && extname(path) === '.json') configurationFile(job, path)
      else output.batchFailed(batch, 'only folders and JSON configuration files are supported')
      continue
    } catch (e) { /* ignore: not a valid path, try regex */ }

    // 2. Try as a regular expression
    let re
    try {
      re = new RegExp(batch)
    } catch (e) {
      getOutput(job).batchFailed(batch, 'invalid regular expression')
      continue
    }
    const scan = async (cwd) => {
      const names = await readdir(cwd)
      for (const name of names) {
        const path = join(cwd, name)
        const pathStat = await stat(path)
        if (pathStat.isDirectory()) {
          if (re.test(path) || re.test(path.replaceAll('\\', '/'))) {
            folder(job, path)
          } else {
            await scan(path) // recurse
          }
        } else if (pathStat.isFile() && (re.test(path) || re.test(path.replaceAll('\\', '/')))) {
          configurationFile(job, path)
        }
      }
    }
    await scan(job.cwd)
  }

  if (job.batchItems.length) {
    job.status = 'Running batch items...'
    await parallelize(task.bind(job), job.batchItems, job.parallel)
  } else {
    output.batchFailed(job.batch, 'no match')
  }

  job.end = new Date()
  job.failed = !!job.failed   // coerce count → boolean
  if (job.failed) process.exitCode = -1
  await save(job)
  if (job.endScript) await end(job)
  output.stop()
  return 0
}
```

**Resolution priority per specification string:**
1. Path resolution (absolute or relative to `job.cwd`):
   - Directory → `folder()` item, `continue`
   - `.json` file → `configurationFile()` item, `continue`
   - Any other file type → `batchFailed(…, 'only folders and JSON configuration files are supported')`, `continue`
2. Regular expression scan (only reached if `stat()` throws — path does not exist):
   - Recursively scans `job.cwd`
   - If a directory matches the regex → `folder()` item (does **not** recurse into it)
   - If it doesn't match → recurse into it
   - If a `.json` file matches → `configurationFile()` item
   - Regex is tested against both the native path and a forward-slash-normalized path (Windows compatibility)

**After all specs are processed:**
- If no items were collected → `batchFailed(job.batch, 'no match')`
- Otherwise → `parallelize(task.bind(job), job.batchItems, job.parallel)`
- In both cases the cleanup block always runs: `job.failed` is coerced from `number` (count) to `boolean`
- `process.exitCode = -1` if any item failed
- `save(job)` writes `job.js` / `package.json` to `job.reportDir`
- `end(job)` runs if `--end` was specified
- `output.stop()` shuts down progress display

### `task()` — runs one batch item as a child process

```js
const task = async function (batchItem) {
  const { id, label, args } = batchItem
  batchItem.start = new Date()
  const job = this
  const output = getOutput(job)
  const progress = newProgress(job)
  const reportDir = join(job.reportDir, id)
  progress.label = `${label} (${id})`
  progress.count = 1
  output.batchStartingTask(label)

  const { promise, resolve, reject } = allocPromise()

  const parameters = [
    ...args,       // ['--cwd', path] or ['--config', path]
    '--batch-mode'
  ]

  if (job[$valueSources]) {
    // Forward --report-dir only if it was explicitly set via CLI
    if (job[$valueSources].reportDir === 'cli') {
      parameters.push('--report-dir', reportDir)
    }
    // Forward all 📡-flagged options that were explicitly set via CLI
    Object.keys(job[$valueSources])
      .filter(name => job[$valueSources][name] === 'cli')
      .forEach(name => {
        const longName = toLongName(name)
        const option = batchParameters[longName] || batchParameters['no-' + longName]
        if (option) {
          parameters.push(option.long)
          if (!option.negate) {
            if (name === 'env') {
              Object.keys(job.env).forEach(key => parameters.push(`${key}=${job.env[key]}`))
            } else if (option.variadic) {
              parameters.push(...job[name].map(value => value.toString()))
            } else {
              parameters.push(job[name].toString())
            }
          }
        }
      })
  }

  const stdoutFilename = join(job.reportDir, `${id}.stdout.txt`)
  const stderrFilename = join(job.reportDir, `${id}.stderr.txt`)
  const stdout = await open(stdoutFilename, 'w')
  const stderr = await open(stderrFilename, 'w')

  const childProcess = fork(join(root, 'index.js'), parameters, {
    stdio: [0, stdout, stderr, 'ipc']
  })

  childProcess.on('message', data => {
    if (data.type === 'progress') {
      progress.count = data.count
      progress.total = data.total
    }
  })

  childProcess.on('close', async code => {
    await stdout.close()
    await stderr.close()
    batchItem.statusCode = code
    batchItem.end = new Date()
    if (code !== 0) reject(code)
    else {
      await unlink(stdoutFilename)
      await unlink(stderrFilename)
      resolve()
    }
  })

  return promise
    .then(
      () => output.log('✔️ ', progress.label),
      (reason) => { ++job.failed; output.log('❌', progress.label, reason) }
    )
    .finally(() => { ++job[$statusProgressCount]; progress.done() })
}
```

Key behaviors:
- `progress.label = "${label} (${id})"` — shown in progress bars and success/failure lines
- `parameters` always starts with `batchItem.args` (the `--cwd` or `--config` arg) then `--batch-mode`
- `--report-dir` is overridden to `<parentReportDir>/<id>` only when `$valueSources.reportDir === 'cli'`
- Only options with `$valueSources[name] === 'cli'` and the 📡 flag are forwarded — defaults are never propagated
- Special serialization:
  - `--env`: serialized as `KEY=VALUE` pairs, each as a separate argument
  - Variadic options (e.g., `--report-generator`): spread as multiple values
  - Negate options (e.g., `--no-coverage`, `--no-npm-install`): appended with no value
- stdout/stderr captured to `<reportDir>/<id>.stdout.txt` and `<reportDir>/<id>.stderr.txt`
- On **success** (exit code 0): stdout/stderr log files are deleted; logs `✔️  label (id)`
- On **failure** (exit code ≠ 0): log files are kept for diagnosis; increments `job.failed`; logs `❌ label (id) <exitCode>`

---

## Entry Point (`index.js`)

```js
async function main () {
  job = fromCmdLine(process.cwd(), process.argv.slice(2))
  output = getOutput(job)
  await recreateDir(job.reportDir)
  const { name, version } = output.version()

  if (job.batchMode) {
    output.batchMode()   // logs ⚠️ [BATCHM]
  }

  output.reportOnJobProgress()
  checkLatest(job, name, version)

  if (job.if && !executeIf(job)) {
    output.skipIf()      // logs ⚠️ [SKIPIF]
    output.stop()
    return               // exit without running
  }

  if (job.mode === 'capabilities') { ... }

  let startedCommand
  if (job.startCommand) {
    startedCommand = await start(job)
  }

  if (job.mode === 'batch') {
    return await batch(job)
      .finally(async () => {
        if (startedCommand) await startedCommand.stop()
        cleanHandles(job)
      })
  }
  // ... normal execution
}
```

- `batchMode` warning is logged before `--if` evaluation — it always appears when a child starts
- `--if` is evaluated **in the child process** (after the child is forked with `--batch-mode`): if falsy, the child exits cleanly with `⚠️ [SKIPIF]` and exit code 0 (not a failure)
- The `--start` command is started **before** `batch()` is called; it is stopped in the `finally` block after `batch()` resolves, regardless of success or failure

---

## The `--if` Conditional (`src/if.js`)

```js
const { punyexpr } = require('punyexpr')

function executeIf (job) {
  return punyexpr(job.if)({
    ...process.env,
    NODE_MAJOR_VERSION: parseInt(parseInt(process.version.match(/v(\d+)\./)[1]))
  })
}
```

`punyexpr` evaluates a small expression language. The evaluation context is:
- All `process.env` entries (environment variables)
- `NODE_MAJOR_VERSION`: the real Node.js major version, computed from `process.version` — **cannot be overridden** by an environment variable (it replaces any `process.env.NODE_MAJOR_VERSION`)

A falsy result (empty string, `false`, `0`, `undefined`) causes the process to skip and exit cleanly.

Example expressions (from `test/e2e/` configs):
- `"NODE_MAJOR_VERSION >= 20"` — require Node 20+
- `"E2E_IGNORE_BROWSER !== 'true'"` — skip if env var is set
- `"ALL_TESTS === 'true'"` — only run when env var is set

---

## Progress Reporting

Child processes (batch items) send IPC messages to the parent via `output.js`:

```js
// src/output.js — inside progress()
if (process.send) {
  process.send({
    type: 'progress',
    count: job[$statusProgressCount],
    total: job[$statusProgressTotal]
  })
}
```

The parent listens in `task()`:

```js
childProcess.on('message', data => {
  if (data.type === 'progress') {
    progress.count = data.count
    progress.total = data.total
  }
})
```

Because `job.batchMode === true` forces `outputInterval = 1000`, children send these updates every 1000 ms on non-interactive output.

The parent renders each in-progress item as a progress bar: `[████░░░░░░] 40% label (id)`.

---

## Sample Output

During execution the main command renders a live progress view:

```
✔️  Legacy JS Sample (JS_LEGACY)
✔️  JSDOM browser (JSDOM)
✔️  Legacy JS Sample with coverage (JS_LEGACY_COVERAGE)
✔️  Legacy JS Sample with junit XML report (JS_LEGACY_JUNIT_REPORT)
[░░░░░░░░░░]   0% Legacy JS Sample (no script injection) (JS_LEGACY_NO_SCRIPT)
[-starting-]      Legacy JS Sample accessed using --url (JS_LEGACY_REMOTE)
⠹ Running batch items...
```

Completed items show ✔️ or ❌. In-progress items show a `[████░░░░░░] N%` bar fed by IPC progress messages from the child process (see [Progress Reporting](#progress-reporting)).

---

## Output Methods

In `src/output.js`:

```js
// Non-interactive only: logged when an item task starts
batchStartingTask: wrap((label) => {
  if (!interactive) log(job, p80()`${label}...`)
}),

// Logged when a batch specification fails to resolve
batchFailed: wrap((batch, reason) => {
  log(job, p80()`⚠️ [BATCHF] Failed to resolve batch ${batch}: ${reason}`)
}),

// Logged at startup of each child process (when --batch-mode is active)
batchMode: wrap((batch, reason) => {
  log(job, p80()`⚠️ [BATCHM] Batch mode item execution`)
}),

// Logged when --if evaluates to falsy
skipIf: wrap(() => {
  log(job, p80()`⚠️ [SKIPIF] Skipping execution (--if)`)
}),
```

Warning codes (documented in `docs/warnings.md`):

| Code | Trigger |
|---|---|
| `BATCHF` | Invalid `--batch` specification (invalid regex, unsupported file type, no match) |
| `BATCHM` | This process is a batch item (logged at startup by the child) |
| `SKIPIF` | The `--if` condition evaluated to falsy; execution is skipped |

---

## Report Directory Structure

When `--report-dir <root>` is set via CLI (`$valueSources.reportDir === 'cli'`), the layout is:

```
<root>/
  job.js                     ← main batch job state (written by save())
  package.json
  output.txt
  <batchId1>/                ← batch item report subfolder
    job.js
    report.html
    coverage/
    ...
  <batchId2>/
    ...
  <id>.stdout.txt            ← child stdout, kept only on failure
  <id>.stderr.txt            ← child stderr, kept only on failure
```

The subfolder name is:
- The `batchId` property from the JSON config file (if present)
- Otherwise: the SHAKE-256 hash of the path via `filename()`

If `--report-dir` was **not** set via CLI (e.g., set by config file or default), the report dir is **not** overridden in children — each child uses its own default report directory.

---

## Parallelism

Controlled by `--parallel` (default: 2). `parallelize(task.bind(job), job.batchItems, job.parallel)` is called from `batch()`. The implication documented in `docs/batch.md`:

> Assuming the default value for `--parallel` is 2, it means 2 batch items are executed in parallel which, themselves, execute 2 test pages in parallel. That makes a total of 4 browsers executed in parallel.

---

## Error Conditions

All errors log `⚠️ [BATCHF]` and are non-fatal to other items:

| Condition | Error message |
|---|---|
| Path exists but is neither a folder nor a `.json` file | `'only folders and JSON configuration files are supported'` |
| `.json` file fails `require()` (malformed JSON) | `'invalid JSON configuration file'` |
| Specification string is an invalid regex | `'invalid regular expression'` |
| No batch items resolved from all specifications | `'no match'` (called with the full `job.batch` array as first arg) |

---

## `$valueSources` and Option Forwarding

`$valueSources` is a Symbol (`src/symbols.js`) stored on the `job` object. It is a dictionary mapping camelCase option names to their source: `'cli'`, `'default'`, `'env'`, `'config'`, etc.

Only options with `source === 'cli'` are forwarded to child processes. This is critical: it prevents the main command's default values from overriding values already set in the child's config file.

`toLongName()` (in `src/job.js`) converts camelCase to kebab-case:
```js
function toLongName (name) {
  return name.replace(/([A-Z])([a-z]+)/g, (match, firstLetter, reminder) =>
    `-${firstLetter.toLowerCase()}${reminder}`)
}
```

The forwarding loop (`task()` lines 69–88):
1. For each `name` where `$valueSources[name] === 'cli'`
2. Convert to long form: `toLongName(name)` → `'globalTimeout'` → `'global-timeout'`
3. Look up in `batchParameters` (or `'no-' + longName` for negate options)
4. If found: push `option.long` (e.g., `'--global-timeout'`)
5. Then (unless negate option):
   - `env`: push each as `KEY=VALUE`
   - variadic: spread all values
   - scalar: push `.toString()`

---

## JSON Configuration File Format

A batch item config file is a standard `ui5-test-runner` JSON config file with two additional top-level fields:

```json
{
  "batchId": "JS_LEGACY",
  "batchLabel": "Legacy JS Sample",
  "if": "NODE_MAJOR_VERSION >= 20",
  "cwd": "../sample.js",
  "libs": ["*=webapp/resources"],
  "end": "../e2e/check.js --qunit-pages 2"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `batchId` | `string` | No | Subfolder name under `--report-dir`; shown in output as `(id)` |
| `batchLabel` | `string` | No | Display label in output |
| `if` | `string` | No | Conditional expression; evaluated by `punyexpr` in the child process |
| all other fields | any | — | Standard `ui5-test-runner` config options passed via `--config` |

---

## NPM Script Examples

From `package.json`:

```json
"test:e2e": "node . --batch \"test/e2e/[\\w_]*\\.json\" --report-dir e2e --start \"node test/e2e/serve.js\" --start-wait-url http://localhost:8081 --start-wait-method HEAD --start-timeout 30s",
"test:e2e:legacy-only": "node . --batch \"test/e2e/JS_LEGACY_[\\w_]*\\.json\" --report-dir e2e --start serve:e2e --start-wait-url http://localhost:8081 --start-wait-method HEAD --start-timeout 30s --debug-verbose start handle --ci"
```

The first script uses a regex to find all `.json` files matching `[\\w_]*` in `test/e2e/`. Because those files have `batchId` properties (e.g., `"JS_LEGACY"`), each item's subfolder is named accordingly.

---

## Full Lifecycle

```
User: node . --batch "test/e2e/[\\w_]*\\.json" --report-dir e2e
                 │
                 ▼
         fromCmdLine() parses argv
         job.batch = ["test/e2e/[\\w_]*\\.json"]
         job.mode = 'batch'
                 │
                 ▼
         main() in index.js
         recreateDir(job.reportDir)   → clears e2e/
         output.version()
         (job.batchMode is false — this is the main command)
         start startCommand if any
                 │
                 ▼
         batch(job)
           job.start = new Date()
           job.batchItems = []
           for each spec in job.batch:
             → regex scan of job.cwd
             → each matching .json → configurationFile() → batchItems.push(...)
           parallelize(task.bind(job), batchItems, job.parallel)
                 │
        ┌────────┴────────┐
        ▼                 ▼
   task(item1)        task(item2)           [up to job.parallel at a time]
   fork index.js      fork index.js
   --config path1     --config path2
   --batch-mode       --batch-mode
   --report-dir       --report-dir
   e2e/ID1            e2e/ID2
        │                 │
        ▼                 ▼
  child process 1   child process 2
  fromCmdLine(...)  fromCmdLine(...)
  job.batchMode=true
  output.batchMode() → ⚠️ [BATCHM]
  if job.if → executeIf() → may ⚠️ [SKIPIF] and exit
  mode = legacy/url
  probes browser, runs pages, generates report
  sends IPC progress messages
  exits 0 or non-0
        │                 │
        ▼                 ▼
  on close:          on close:
  code=0 → delete    code≠0 → keep
  stdout/stderr      stdout/stderr
  log ✔️              log ❌, ++failed
        │
        ▼
  all items done
  job.end = new Date()
  job.failed = !!count
  if failed → process.exitCode = -1
  save(job) → e2e/job.js
  if endScript → end(job)
  output.stop()
```

---

## Unit Test Coverage (`src/batch.spec.js`)

The spec tests these behaviors:
- Reading `batchId` and `batchLabel` from a JSON config file
- Resolving a folder path relative to `job.cwd`
- Regex scan matching both folders and JSON files
- Error: non-`.json` file path → `batchFailed`
- Error: invalid JSON file → `batchFailed`
- Error: invalid regex → `batchFailed`
- Error: no items matched → `batchFailed` with `'no match'`
- `task()` injects `--batch-mode` into child args
- `task()` overrides `--report-dir` to `<parentReportDir>/<id>` when `$valueSources.reportDir === 'cli'`
- `task()` forwards CLI-sourced 📡 options correctly (including variadic, negate, and `--env` cases)
- Success path: logs `✔️  label (id)`, deletes stdout/stderr files
- Failure path: logs `❌ label (id) exitCode`, increments `job.failed`
