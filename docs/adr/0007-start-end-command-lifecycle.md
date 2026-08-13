# ADR-0007: Start/End Command Lifecycle

## Status
Accepted

## Context

UI5 test suites commonly require external infrastructure: a mock backend, a local OData service, or an app server that must be running before any browser opens a test page and must be torn down (or inspected) after all tests complete. The tool needs a first-class mechanism for this that:

1. **Works with NPM scripts**: project teams define server commands in `package.json`; requiring raw binary paths forces duplication and breaks on Windows paths
2. **Supports parameter injection**: start/end commands often need runtime values (port number, report directory, final exit code) that are only known after configuration resolves
3. **Produces visible output**: server startup logs are diagnostic; silencing them by default (as browser subprocess output is) would hide critical startup errors
4. **Gives the end command authority over the result**: a post-test script may validate coverage, clean artefacts, or bless a known-flaky failure — the tool must honour that judgment
5. **Works cross-platform without shell dependency**: spawning via `sh -c` or `cmd /c` creates platform divergence; the implementation must resolve everything to a direct `node` invocation

## Decision

Pre-test (`--start`) and post-test (`--end`) commands are parsed, substituted, and spawned as direct Node.js child processes — never via a shell. NPM script names are auto-detected and rewritten to `node [npm-cli.js] run <name>`. The end command has unconditional authority to override `Exit.code` in either direction.

```
  ┌──────────────────────────────────────────────────────────┐
  │  Command.parse(configuration, commandString, extras?)    │
  │                                                          │
  │  1. split into tokens (respects quoting)                 │
  │  2. extract leading KEY=value pairs → env                │
  │  3. resolve executable:                                  │
  │       "npm"        → node [npm-cli.js]                   │
  │       "node"       → node                                │
  │       <scriptName> → node [npm-cli.js] run <scriptName>  │
  │       <binary>     → <binary>                            │
  │  4. substitute {{optionName}} tokens                     │
  │                                                          │
  │  returns [executable, args[], env{}]                     │
  └────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────┐
  │  Process.spawn(executable, args, {                       │
  │    env: { ...Host.env, ...env },                         │
  │    forceRender: true,                                    │
  │    onMessage?: ...,                                      │
  │  })                                                      │
  └────────────────────────┬─────────────────────────────────┘
                           │
                    stdout / stderr lines
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────┐
  │  logger (source: 'process/stdout' | 'process/stderr',    │
  │           forceRender: true)                             │
  │                                                          │
  │  BaseLoggerOutput._shouldRender():                       │
  │    forceRender → always render (terminal + output.txt)   │
  │    otherwise   → suppressed (log file only)              │
  └──────────────────────────────────────────────────────────┘
```

### NPM Script Auto-Detection

`Command.parse()` (`src/Command.ts`) tokenises the command string, then inspects the first non-env token:

- `"npm"` — rewrite: `node [npmCliPath]` + remaining args
- `"node"` — keep as-is: `node` + remaining args
- anything else — call `Npm.listPackageScriptNames(configuration.cwd)`:
  - if the name appears in `package.json` scripts → `node [npmCliPath] run <name>` + remaining args
  - otherwise → treat as a raw executable binary

`Npm.getCliPath()` is memoized: it runs `npm` once, parses the `npm@semver /absolute/path` line from stdout, and derives `path/bin/npm-cli.js`. This avoids a shell dependency (`npm` on `$PATH`) and works identically on Windows and POSIX.

### Parameter Substitution

`{{optionName}}` tokens in the command string are replaced with `configuration[optionName].toString()`. An optional `extras` map overrides configuration keys for values that only exist at runtime. The end command automatically receives `extras = { exitCode: String(Exit.code) }`, allowing:

```
--end "node report.js --exit={{exitCode}}"
```

Unknown substitution keys throw immediately, surfacing misconfiguration before any process is spawned.

### Environment Variable Injection

Leading `KEY=value` tokens are extracted before the executable token and merged with `Host.env`:

```
--start "BASE_URL=http://localhost:8080 npm run serve"
```

Values in the `KEY=value` prefix are also substituted, so `BASE_URL={{url}}` works. The merged env is passed verbatim to `Process.spawn()`.

### `forceRender` Output Bypass

The structured logger suppresses `process/stdout` and `process/stderr` sources by default — browser subprocess output would otherwise flood the terminal during test execution. Start and end commands are different: their output is diagnostic and must be visible.

`Process.spawn()` accepts `SpawnOptionsExtended.forceRender?: true`. When set, every stdout/stderr line is logged with `forceRender: true` in its attributes. `BaseLoggerOutput._shouldRender()` checks this flag before the source filter:

```typescript
// ✅ forceRender bypasses the suppressed-source list
return forceRender || (!DO_NOT_RENDER_SOURCE.includes(source) && level !== LogLevel.debug);
```

This keeps the log source taxonomy unchanged while giving per-process control over terminal visibility. The lines are stored in the compressed log file regardless.

### End Command Exit Code Authority

After the end command process closes, `end()` unconditionally writes its exit code into `Exit.code`:

```typescript
// ✅ End command has full authority — both directions are warned and honoured
if (previousCode !== Exit.code) {
  logger.warn({ source: 'end', message: `Status changed to ${Exit.code === 0 ? 'success' : 'error'} by end command` });
}
```

This is intentional: an end command can bless a failure (known flaky test that will be fixed separately) or taint a success (coverage threshold missed, artefact validation failed). The `logger.warn` ensures the transition is always visible in logs.

If the end command exceeds `--end-timeout`, it is killed and `Exit.code` is set to `-1`.

### Start Command Lifecycle Differences in Batch Mode

In **test mode**: `start()` returns the `IProcess` handle; the process runs for the duration of the test suite. `Exit.registerAsyncTask` ensures it is cleaned up on shutdown.

In **batch mode**: the handle is stored explicitly and killed in a `finally` block after all child processes complete. `end()` is not called in batch mode — the start process is terminated directly, not conditionally on any end command.

## Consequences

### Positive
- ✅ **No shell dependency**: all resolutions produce a `node` + args invocation; no `sh`/`cmd` intermediary; consistent behaviour on Windows and POSIX
- ✅ **NPM scripts work transparently**: `--start serve` works if `serve` is in `package.json` scripts, without the user knowing about npm-cli.js
- ✅ **End command is a first-class result gate**: post-test validation scripts can change the outcome; the tool honours and logs the transition
- ✅ **`forceRender` is additive**: the existing log source taxonomy is unchanged; no new source names needed for lifecycle command output
- ✅ **Substitution errors fail fast**: unknown `{{key}}` tokens throw before any process is spawned

### Negative/Trade-offs
- ❌ **`npm run` overhead**: routing NPM scripts through `npm-cli.js` adds one extra Node.js process startup compared to running the script's binary directly
- ❌ **End command replaces exit code unconditionally**: there is no "only override on failure" mode; callers must be deliberate about exit codes
- ❌ **`startWaitUrl` polling is not cancellable mid-test**: if the start server crashes after the poll succeeds, there is no re-check mechanism

### Mitigation
- NPM script detection is memoized; the overhead is paid once per invocation
- The `logger.warn` on exit-code transitions makes accidental overrides immediately visible
- `--start-timeout` bounds the wait for `startWaitUrl` if the server never becomes ready

## Related Files & Modules

- **`src/Command.ts`** — tokenisation, NPM script detection, `{{param}}` substitution, env extraction
- **`src/start.ts`** — spawns the start command; polls `startWaitUrl`; returns `IProcess` handle
- **`src/end.ts`** — spawns the end command; overwrites `Exit.code` unconditionally; logs status transitions
- **`src/Npm.ts`** — `getCliPath()` (memoized npm binary resolution), `listPackageScriptNames()` (reads `package.json`)
- **`src/platform/Process.ts`** — `SpawnOptionsExtended.forceRender`; `IProcess` interface; per-line stdout/stderr logging
- **`src/platform/logger/output/BaseLoggerOutput.ts`** — `_shouldRender()`: `forceRender` check before source filter
- **`src/platform/logger/types.ts`** — `LogAttributes.forceRender?: true`; `DO_NOT_RENDER_SOURCE` list
- **`src/platform/Exit.ts`** — `Exit.code` read/write; `registerAsyncTask` for start process cleanup
- **`src/modes/test/index.ts`** — calls `start()` before server, `end()` after report save
- **`src/modes/batch/index.ts`** — calls `start()`, kills handle in `finally`; does not call `end()`
