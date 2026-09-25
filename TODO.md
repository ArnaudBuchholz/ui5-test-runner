# TODO Backlog

Inventory of `TODO` comments found in `src/`, categorized by complexity and estimated
effort. This file is a working document: we will discuss each item, refine the notes,
and turn the agreed-upon ones into an implementation plan that a cheaper LLM can execute.

Legend:

- 🟢 Trivial / quick win (< 30 min)
- 🟡 Moderate (1–3 hrs)
- 🔴 Complex / needs design (half-day+ or deferred)
- ⚪ Not actionable (comment/annotation, not a work item)

Status column: `open` / `planned` / `in-progress` / `done` / `wontfix`.

---

## 🟢 Trivial / Quick wins

| # | Location | TODO | Assessment | Status |
|---|----------|------|------------|--------|
| 1 | `configuration/validators/integer.ts:8` | *what about negative numbers?* | **PLANNED** — resolved via type modifiers (like `fs-entry`), not a rename. See detailed plan below. | planned |
| 2 | `agent/qunit.ts:145` | *timeout should be configurable* | **PLANNED** — new `agentScreenshotTimeout` option (agent-prefixed, `timeout` type/ms, browserExposed). See detailed plan below. | planned |
| 3 | `browsers/puppeteer.ts:45` | *is there a way to monitor progress?* | **WONTFIX** — remove the comment. Programmatic `install()` with byte progress exists but isn't worth mirroring puppeteer's buildId/cacheDir/platform resolution for a rare one-time install; the indeterminate spinner is fine. See note below. | done |

## 🟡 Moderate

| # | Location | TODO | Assessment | Status |
|---|----------|------|------------|--------|
| 4 | `Npm.ts:31` | *check codes and stdout format* | **PLANNED** — `getRoots()` never checks the `npm root` exit code or validates stdout, so a failed/empty result silently becomes a broken root path that surfaces as a confusing downstream "module not found". Add code + stdout validation using the existing `assert` pattern. See plan below. | done |
| 5 | `modes/test/pageTask.ts:301` | *add a catch block, document problem in report* | **PLANNED** — the outer page `try` (line 241) has only a `finally`, no `catch`. An unexpected throw (e.g. `browser.newWindow()` failing to launch/navigate) is swallowed by `parallelize`'s settled semantics, so the page **silently vanishes from the report** instead of appearing as failed. Add a `catch` that logs and calls `reportError(url, ...)`. See plan below. | done |
| 6 | `browsers/puppeteer.ts:24` + `browsers/playwright.ts:25` | *maximize vs viewport* / *define args for chrome* | **PLANNED (split)** — puppeteer comment is **stale** (git blame: comment 2026-08-04 predates the ternary fix 2026-09-21; already correct) → just remove it. Playwright **ignores `settings.viewport` entirely** (real bug) → set viewport at browser creation via an explicit `newContext({ viewport })`, since `viewport` is a `BrowserSettings`/`setup`-level property and a `newWindow` is a tab. See plan below. | done |
| 7 | `modes/test/index.ts:36` | *only when local is being used* | **PLANNED** — the `sap-ui-version.json` fetch+log runs unconditionally, but it only reflects the **local server's** UI5; when the user tests a remote `--url`, the log is misleading and the round-trip is pointless. Gate it on the resolved page URL being a loopback host. See plan below. | planned |
| 8 | `modes/log/index.ts:87` | *pass the abort signal here* | **WONTFIX (stale comment)** — the very next line already passes `abortSignal` into `LogReader.read`, which threads it through `FramedStreamReader` (honored). Git blame: TODO added `23:23`, signal wired `23:33` same day — comment just never deleted. Only action: remove the comment. | done |

## 🔴 Complex / needs design

| # | Location | TODO | Assessment | Status |
|---|----------|------|------------|--------|
| 9 | `modes/mcp/knowledgeBase.ts:14` | *implement GitHub fetch strategy (see ADR-0011)* | **PARKED (implement later).** ADR-0011 specifies a full remote-KB strategy: `raw.githubusercontent.com` for content, GitHub Contents API for listing, git-tree SHA for cache invalidation, local caching, rate-limit handling. This is a feature, not a cleanup (~1 day) — deferred by decision; revisit when the feature is scheduled. | parked |
| 10 | `Npm.ts:23` | *`detached: true` — better?* | **PLANNED (enforce, don't default).** `detached: true` is **load-bearing on POSIX**: it makes the child a process-group leader so `Process.kill()`'s `process.kill(-this.pid)` reaps the whole subtree (npm's install children). It's easy to forget per call site (e.g. `batchTask.ts:84` spawns a child runner **without** it). Rather than change spawn defaults (Windows/IPC blast radius), make the coupling **self-checking**: when `kill(-pid)` throws and we fall back to `kill(pid)`, emit a WARN that the subtree may be orphaned. Keep the `detached: true` at the call site; replace `// TODO: better ?` with a short comment pointing at `Process.kill`. See plan below. | done |
| 11 | `platform/Exit.ts:161` | *wait for task to be unregistered?* | **WONTFIX (delete comment).** Waiting for unregistration can't be universal: most tasks register **without** a disposed `using` handle (browser, Server, mcp, log, Process, factory, FramedStreamReader) — they're never unregistered during shutdown, so `stop()` resolving is their only completion signal; waiting on dispose would hang. Current `stop()`-then-pop-if-still-tail + lenient dispose assert is already race-safe and matches ADR-0010. Design is sound; just delete the exploratory TODO. See plan below. | done |
| 12 | `platform/logger.ts:17` | *why doesn't `channel` appear as a problem…* | **PLANNED (explain + keep comment)** — the worry is unfounded: every bare `channel.` access is transitively gated behind `start()` having assigned it (workers run `start()` at module load; main thread reaches bare accesses only via `logger.start()`/the `onmessage` path, and the eager `log()` buffers until `isReady`). Replace the anxious TODO with a comment documenting the invariant. No behavior change. See plan below. | done |
| 13 | `agent/opaIframeCoverage.ts:3` | *how to ensure it's added to each IFrame?* | **WONTFIX (delete comment).** Already guaranteed by construction: the agent bundle (`agent/index.ts` imports this module) is injected by the driver via `addInitScript` (playwright) / `evaluateOnNewDocument` (puppeteer), both of which run in **every frame**; the `if (IS_IN_IFRAME)` guard then self-installs the `__coverage__`→`top.__coverage__` proxy per iframe. Works for same-origin OPA `iStartMyAppInAFrame` (the supported case). Delete the exploratory TODO. See plan below. | done |

## ⚪ Not actionable

| # | Location | TODO | Note | Status |
|---|----------|------|------|--------|
| 14 | `Npm.ts:89` | *check if package.json is required here* | **PLANNED (simplify to dir base).** Verified (Node repro): `package.json` is **not** required — `createRequire` accepts a non-existent path without throwing, and `require.resolve(moduleName, { paths: [nodeModulesPath] })` uses the **explicit** `paths`, so the base is only an anchor. Simplify the base to a directory URL (`${cwd}/`, matching `listPackageScriptNames` Npm.ts:234), drop the misleading `'package.json'` filename, remove the TODO. See plan below. | done |
| 15 | `modes/batch/batchTask.ts:40` | *some options might need a rewrite* | **PLANNED (default serializer + round-trip proof).** Batch forwarding re-serializes cli-sourced options to args, but only `json`/`boolean`/scalar round-trip; a **complex** type (`library-mapping`, i.e. `lib`) whose parsed form ≠ its CLI string would forward `[object Object]`. Latent today (`lib` not yet `batchForwarded`; `regexp`/`pageFilter` round-trips by luck). Fix: default serializer `` `${value}` `` for the trivial types, an optional per-type `serialize` for deviating types, and a **CI invariant test** proving `validate→serialize→validate` deep-equals (a complex type without a working serializer fails CI), plus a lightweight runtime `assert` backstop. Fixes the `multiple`-branch too (real bug site). See plan below. | planned |

---

## Recommendation (post-triage)

All 15 items are resolved to a decision. Rollup:

- **Comment-only deletions (no code, no tests)** — do these first, batch them: #3, #8, #11, #13.
- **Comment/doc-only replacements (no behavior change)** — #12 (invariant comment).
- **Small self-contained code changes** — #14 (dir base), #7 (gate the version fetch), #6a (delete
  stale comment) then #6b (playwright viewport).
- **Moderate code + tests** — #1 (integer modifiers + `help.ts` tweak), #2 (`agentScreenshotTimeout`
  option), #4 (`getRoots` validation), #5 (page-task catch), #10 (kill-fallback WARN).
- **Infrastructure (largest, forward-looking)** — #15 (batch-forward serializer + CI round-trip
  invariant). Ship last; it prepares for a case that doesn't exist yet (`lib` not forwarded).
  **⚠️ Escalate #15 to a stronger model — do not implement it on a cheaper model unsupervised**
  (string-level round-trip invariant + async backstop + no failing behavior to anchor against; see
  the boxed warning at the top of the #15 note).
- **Deferred / feature** — #9 (ADR-0011 remote KB); revisit when scheduled.

Suggested order: comment cleanups (#3/#8/#11/#12/#13) → #14 → #6 → #7 → #4 → #5 → #2 → #1 → #10 →
#15. #9 stays parked.

**Implementability note (for the executing LLM):** every item below carries exact file paths,
verified line numbers, current-code snippets, and explicit test guidance. Line numbers were
verified against the working tree on 2026-09-23; if the tree has drifted, locate by the quoted
code/TODO text rather than trusting the number. Test rules to honor throughout (see memory):
global platform mock is a setup file — **never** add `vi.mock('./platform/mock.js')`;
UPPER_SNAKE_CASE constants in specs; assert observable outcomes, not call-count proxies.

## Notes / decisions

### #1 — integer validator & negative numbers → RESOLVED via type modifiers

**Decision:** Keep the type named `integer` (it describes the parse contract: "whole
number, no fraction"). Range policy is expressed per-option via **type modifiers**, reusing
the exact mechanism `fs-entry` already uses (`file` / `overwrite` / `safe-default`). No rename
to `positive_integer` — a rename conflates parse contract with range policy and does not
generalize.

**Rejected alternatives:**
- Rename type to `positive_integer` — conflates concerns, high blast radius, doesn't scale
  to future bounded cases.
- Parameterized `min` / `max` modifiers — more expressive (e.g. `port <= 65535`) but
  `typeModifiers` is a `Set<string>` (flag-style only); values would need a schema + doc-gen
  change. Deferred; can revisit if a real bounded case appears.

**Chosen:** two flag-style, integer-scoped modifiers, combinable per option:
- `positive` — rejects values `< 0` (allows `0`).
- `non-zero` — rejects `0`.

**Per-option assignment** (all 5 current `integer` options are non-negative; verified against
their docs):

| Option | Modifiers | Effective range | Rationale |
|--------|-----------|-----------------|-----------|
| `browserViewportWidth` | `positive`, `non-zero` | ≥ 1 | pixels |
| `browserViewportHeight` | `positive`, `non-zero` | ≥ 1 | pixels |
| `parallel` | `positive`, `non-zero` | ≥ 1 | execution count |
| `port` | `positive`, `non-zero` | ≥ 1 | TCP port |
| `npmInstallMinReleaseAge` | `positive` | ≥ 0 | doc says `0` = disable |

**Implementation steps (for the implementer LLM):**
1. In `src/configuration/validators/integer.ts`, after the existing whole-number check, read
   `option.typeModifiers`:
   - if it has `positive` and `value < 0` → throw `OptionValidationError.createInvalidValue(option)`.
   - if it has `non-zero` and `value === 0` → throw `OptionValidationError.createInvalidValue(option)`.
   Follow the `fsEntry.ts` pattern: `option.typeModifiers?.has('positive') ?? false`.
   Remove the `// TODO` comment.
2. Create two modifier doc files under `docs/options/types/modifiers/`, each with frontmatter
   `types:\n  - integer` and a one-line description (mirror `file.md` / `overwrite.md` format):
   - `positive.md` — "the value must be zero or greater (negatives rejected)."
   - `non-zero.md` — "the value must not be zero."
3. Add `typeModifiers:` blocks to the 5 option docs per the table above
   (`docs/options/browserViewportWidth.md`, `browserViewportHeight.md`, `parallel.md`,
   `port.md`, `npmInstallMinReleaseAge.md`).
4. Regenerate: run `make options` (do **not** hand-edit `src/configuration/options.ts`).
5. Tests: add spec cases to the integer validator test — `positive` rejects `-1`, accepts `0`;
   `non-zero` rejects `0`, accepts `1`; no modifiers still accepts negatives. Follow existing
   validator spec conventions.
6. Verify the help output renders the new modifiers (check `src/modes/help.ts` picks up
   integer modifiers the same way it does for `fs-entry`).

**⚠️ Verified caveat (was an open question — now confirmed a real gap):** `src/modes/help.ts`
does **not** render modifiers generically. At `help.ts:54–55` the modifier suffix is emitted
**only** for `option.type === 'enumeration'`:
```ts
return option.type === 'enumeration' && option.typeModifiers
  ? `${option.description} (${[...option.typeModifiers].join(', ')})`
  : ...
```
So `fs-entry` modifiers (`file`/`overwrite`/`safe-default`) are already **not** shown in help
today, and new `integer` modifiers won't be either. The implementer must decide: (a) generalize
the `help.ts` condition to any type that has `typeModifiers` (recommended — one-line change:
drop the `=== 'enumeration'` guard, keep the `option.typeModifiers` truthiness check), or
(b) leave help as-is for parity with `fs-entry`. **Recommendation: (a)** — it's trivial and
makes the new range modifiers discoverable. Confirm no snapshot/help test hardcodes the old
behavior before changing. `make options` doc-gen **is** type-agnostic about modifiers (verified
via `fsEntry` — modifiers flow through the shared `typeModifiers` set), so only `help.ts` needs
the touch.

**Verified — current validator state:** `src/configuration/validators/integer.ts` today is
exactly (the `// TODO` to remove is line 8):
```ts
export const integer: OptionValidator<'integer'> = (option, value) => {
  if (typeof value === 'string') {
    value = Number.parseInt(value);
  }
  // TODO: what about negative numbers ?
  if (typeof value !== 'number' || value % 1 !== 0) {
    throw OptionValidationError.createInvalidValue(option);
  }
  return value;
};
```
The new checks go **after** the existing whole-number `throw` (so `value` is a validated
integer), using `OptionValidationError.createInvalidValue(option)` (already imported).

_(Other items to be filled in as we discuss them.)_

### #2 — hardcoded OPA screenshot timeout → new `agentScreenshotTimeout` option

**Context / what the `10` actually is:** at `src/agent/qunit.ts:145`, inside the `QUnit.log`
handler, when `screenshot` is enabled the agent calls `Opa5.prototype.waitFor({ timeout: 10, ...})`
to wait for the previously requested screenshot to be captured before continuing. OPA5's
`waitFor.timeout` is in **seconds** (verified against the vendored `@openui5/types`:
`sap.ui.core.d.ts` documents the param as "the timeout in seconds"; Opa config default is
15 s), so `10` = 10 seconds. This runs **browser-side** (in the agent).

**Not to be confused with** the existing `screenshotTimeout` option (`type: timeout`, 5000ms) —
that is server-side, the cap on how long `page.screenshot()` may take, used in
`src/modes/test/screenshot.ts`. Different side, different unit, different meaning. Do **not**
reuse it.

**Decision:** introduce a new option `agentScreenshotTimeout`, following the established
`agent*` convention for agent-side options (verified against `agentNoTestsTimeout`,
`agentDetectionTimeout`, `agentDetectionInterval` — all `type: timeout`, `browserExposed: yes`,
tag `agent`).

- Name: `agentScreenshotTimeout`
- Type: `timeout` (→ **milliseconds**, consistent with all other agent timeouts)
- Default: `10000` (= the current 10 seconds)
- `browserExposed: yes` (must reach the agent via `getConfig()`), tag `agent`
- The option is ms but OPA's `waitFor.timeout` is seconds, so at the call site set
  `timeout: Math.ceil(agentScreenshotTimeout / 1000) + 1`:
  - `Math.ceil` so a sub-second remainder isn't truncated (10500 ms → 11 s, not 10).
  - `+ 1` guard second so OPA's own timeout never fires *before* the intended ms budget
    due to rounding / polling alignment.
  - Consequence (document with a code comment): the *effective* timeout is slightly longer
    than the nominal ms value (up to ~2 s worst case). Acceptable — this is a best-effort
    "wait for pending screenshot" grace period, not a precise SLA.
- Also set `pollingInterval: 50` (default is 400 ms) so the check reacts quickly once the
  pending screenshot clears — the common case resumes near-instantly instead of waiting up
  to a full polling interval per assertion.

**Implementation steps (for the implementer LLM):**
1. **Add the option via the `add-option` workflow — do NOT hand-edit `src/configuration/options.ts`.**
   Create `docs/options/agentScreenshotTimeout.md` mirroring `docs/options/agentNoTestsTimeout.md`:
   ```
   ---
   "#type": option
   type: timeout
   summary: maximum time OPA waits for a pending screenshot before continuing
   default: "10000"
   browserExposed: yes
   tags:
     - agent
   ---
   ```
2. Regenerate: run `make options` (regenerates `src/configuration/options.ts`).
3. Add `agentScreenshotTimeout: number;` to the agent config type in
   `src/agent/Configuration.ts` (the type explicitly enumerates each browserExposed option).
4. In `src/agent/qunit.ts`:
   - add `agentScreenshotTimeout` to the destructuring at line ~60
     (`const { agentNoTestsTimeout, screenshot, pageId } = getConfig();`).
   - at line ~145 update the `waitFor` settings and remove the `// TODO: should be configurable`
     comment:
     ```js
     opa5?.prototype.waitFor({
       // agentScreenshotTimeout is ms; OPA waitFor.timeout is seconds. ceil + 1 guard second
       // so OPA's own timeout never fires before the ms budget elapses (effective timeout may
       // run up to ~2s longer than nominal — acceptable for this grace period).
       timeout: Math.ceil(agentScreenshotTimeout / 1000) + 1,
       pollingInterval: 50, // react quickly once the pending screenshot clears (default 400ms)
       autoWait: false, // Ignore interactable constraint
       check() {
         return state.type === 'QUnit' && !state.pendingScreenshot;
       }
     });
     ```
5. Verify the value is actually plumbed into the browser-exposed config that the agent reads
   (confirm the browserExposed serialization includes new agent options automatically — it
   should, since it's driven by the `browserExposed` flag, but check where the agent config
   object is assembled).
6. Tests: add/adjust a qunit agent spec asserting `waitFor` is called with
   `timeout === agentScreenshotTimeout / 1000` (follow existing qunit spec conventions and the
   platform-mock/global-setup rules). If there's a config-forwarding test that lists
   browserExposed options, add the new one there.

**Open question for implementer:** confirm nothing else references the literal OPA `waitFor`
timeout and that `10000 / 1000 = 10` preserves current behavior exactly (it does).

### #3 — puppeteer install progress → WONTFIX (remove comment)

**Decision:** remove the TODO. Do **not** implement byte-level progress.

**Rationale:**
- `@puppeteer/browsers` `install()` does expose `downloadProgressCallback(downloaded, total)`,
  and the progress bar renderer already supports determinate `value`/`max`, so it is
  *technically* feasible. But the current shell-out (`npx puppeteer browsers install <target>`)
  works and lets `npx` resolve which build to install and where.
- Switching to programmatic `install()` requires supplying `browser` + `buildId` + `cacheDir` +
  `platform` — reconstructing resolution logic that lives inside puppeteer and can drift on
  every version bump. That is ongoing coupling to puppeteer internals just to render a bar.
- Browser install is a rare, one-time event (first run / CI cache miss). A determinate bar is
  polish with negligible payoff.
- The comment is already a *resolved* question (`YES: <url>`), i.e. a note-to-self, not pending
  work.

**Implementation step (for the implementer LLM):**
1. In `src/browsers/puppeteer.ts`, delete the two comment lines at ~45–46
   (`// TODO: is there a way to monitor the progress ?` and `// YES: ...installoptions`).
   Leave the surrounding install logic (indeterminate spinner + `npx` shell-out) unchanged.
2. No test changes, no doc changes.

**Note:** `src/browsers/playwright.ts` has the same indeterminate-spinner pattern but no TODO —
leave it as-is for consistency.

### #4 — `getRoots()` doesn't validate npm exit code / stdout

**Context:** `src/Npm.ts` `getRoots()` runs `npm root` and `npm root --global`, awaits
`.closed`, then does `.stdout.trim()` on each. Two gaps:
- `Process.spawn(...).closed` **always resolves** (it never rejects on a non-zero exit — verified
  in `src/platform/Process.ts`, the `close` handler just records `code` and resolves). So a failed
  `npm root` is not noticed.
- No stdout validation. `npm root` prints a single absolute directory path; on failure the
  trimmed stdout may be empty or garbage. Today that empty string becomes the root path and later
  surfaces as a confusing "module not found" far from the real cause.

**Established pattern to follow** — per CODING_GUIDELINES.md *Assertion* section, a failing
**subprocess exit code is a runtime operation failure**, not an internal invariant, so use
`throw new Error(...)`, **not** `assert`. (`assert` would route through `logger.fatal` →
`Exit.shutdown()`, terminating the command — reserved for invariants.) The guideline's own
example matches this case:
- `src/modes/test/coverage/report.ts:25` — `if (proc.code !== 0) throw new Error('nyc merge failed with code ${proc.code}')`
- Guideline example: `throw new Error(\`nyc merge failed with code ${mergeProc.code}\`)`

(Note: `coverage/instrument.ts` uses `assert` for the same shape — that is the *less* correct
side of the rule; follow `report.ts`.)

**Decision:** validate both processes after `.closed`, throwing a plain `Error` on failure:
1. exit code === 0 for each (local and global), with a clear message including the code;
2. trimmed stdout is a non-empty absolute path for each.

Also fold in a small pre-existing redundancy: the function computes `local`/`global` for the
debug log, then returns `localRootProcess.stdout.trim()` / `globalRootProcess.stdout.trim()`
*again* — return the already-computed `local`/`global` instead.

**Implementation steps (for the implementer LLM):**
1. In `getRoots()` (`src/Npm.ts`), after `await Promise.all([...closed])` and before/at the
   trim, add validation using `throw new Error` (not `assert`). Suggested shape (match
   surrounding style; use `Path.isAbsolute`):
   ```ts
   const validateRoot = (proc: IProcess, label: string): string => {
     if (proc.code !== 0) {
       throw new Error(`npm root ${label} failed with code ${proc.code}`);
     }
     const value = proc.stdout.trim();
     if (value === '' || !Path.isAbsolute(value)) {
       throw new Error(`npm root ${label} returned an invalid path: "${value}"`);
     }
     return value;
   };
   const local = validateRoot(localRootProcess, '(local)');
   const global = validateRoot(globalRootProcess, '(global)');
   ```
   Remove the `// TODO check codes and stdout format` comment.
2. Return `{ local, global }` reusing those validated values (drop the duplicate `.stdout.trim()`
   calls in the return object).
3. Confirm `IProcess` (or the process type) is importable/typeable here for the helper param; if
   awkward, inline the two checks without the helper — keep it simple and consistent.

**Tests (`src/Npm.spec.ts`):**
- The shared `makeProcess` helper (line ~78) currently returns `{ stdout, closed }` with **no
  `code`**. Once `getRoots` reads `proc.code`, add `code: 0` to `makeProcess` (default) so the
  existing global `Process.spawn` mock (lines ~83–92) keeps passing.
- Add cases asserting the operation **rejects with a clear Error** (not a fatal shutdown — this
  path uses `throw new Error`, so assert on the rejected promise / thrown message, per the
  *Asserting no-op paths* and testing conventions) when (a) `npm root` exits non-zero,
  (b) stdout is empty, (c) stdout is a non-absolute string. Follow existing spec conventions
  (mocking, `UPPER_SNAKE_CASE` constants). Note `getRoots` is `memoize`d — the spec already
  comments on first-invocation setup; ensure new failing-case tests aren't defeated by a cached
  success (may need fresh module state as the existing tests do).

**Open question for implementer:** confirm the exact env where `npm root` could legitimately
return a relative path or empty output (shouldn't, but if `Path.isAbsolute` proves too strict on
some platform/CI, relax to just the non-empty check).

### #5 — page task has no outer `catch`; unexpected failures vanish from the report

**Context:** in `src/modes/test/pageTask.ts`, the task returned by `makePageTask` has an outer
`try` (line ~241) with **only a `finally`** (line ~302) — no `catch`. The body launches the page
(`browser.newWindow()`, ~247), runs the polling loop, then post-loop does
`page.eval(...results)` / `handleFailureScreenshot` / `collectCoverage` / `mergeTestResults`
(~294–297).

Known/expected failures are already surfaced via explicit `reportError(url, msg)` calls (fetch
failure ~176, global timeout ~220, page timeout ~299). But an **unexpected** throw in the outer
body — most likely `browser.newWindow()` failing to launch/navigate, or a post-loop
`eval`/coverage error — is **not** handled here.

**What happens today (traced):** `parallelize` (`src/utils/shared/parallelize.ts`) uses settled
semantics — its fiber catches the throw (line ~72) and records the task as `rejected`, so the run
does **not** crash. But the page's `finally` runs cleanup with **no `reportError`**, so the page
produces **no entry in the test report at all** — it silently disappears from results. Silent
disappearance is worse than a visible failure.

**The mechanism to use** — `reportError(url, message)` (defined at `pageTask.ts:62`) synthesizes a
CTRF result of 1 test / 1 failed with message `"<message>, check the logs"` and merges it into the
report builder. This is exactly what the other known-failure sites use.

**Decision:** add a `catch (error)` to the outer `try` (between the `reportError(url, 'Page timed
out')` block ~298–300 and the `finally` at ~302) that:
1. logs the error via `logger.error({ source: 'page', message: ..., error, pageId, data: {} })`
   (matching the existing error-log style in this file);
2. calls `reportError(url, 'An unexpected error occurred')` (or similar) so the page is recorded
   as a failed test instead of vanishing.
Remove the `// TODO` comment.

**Subtlety (document in the plan, not necessarily code):** results may be *partially* merged
before a throw — `mergeTestResults` (~297) runs before `collectCoverage`/`isTimedOut`. If a *late*
line throws after a merge, the new catch's `reportError` would add a synthetic failure *on top of*
real results (slight double-count). This is acceptable: the page genuinely failed, so reporting it
as failed is truthful; and the dominant real-world case is `newWindow()` throwing *before* any
merge. Do **not** over-engineer conditional reporting — report unconditionally in the catch.

**Implementation steps (for the implementer LLM):**
1. In `src/modes/test/pageTask.ts`, add the `catch` block to the outer `try` immediately before
   the `finally` at ~302:
   ```ts
       if (isTimedOut) {
         reportError(url, 'Page timed out');
       }
     } catch (error) {
       logger.error({ source: 'page', message: 'Unexpected error while running page', error, pageId, data: {} });
       reportError(url, 'An unexpected error occurred');
     } finally {
   ```
   Remove the `// TODO: add a catch block and document the problem in the test report` comment.
2. Leave the inner loop's `try/catch` (~275–287) and the cleanup `finally` unchanged.

**Tests (`src/modes/test/*` — follow existing pageTask spec conventions):**
- Add a scenario where `browser.newWindow()` (mocked) throws → assert the report builder receives
  a failed result for that url (assert the observable outcome via `getReportBuilder().merge` /
  the resulting report, per the *What tests should express* guideline — not a call-count proxy),
  and that the run does not reject out of the task.
- Optionally a case where a post-loop step throws after partial merge, documenting the accepted
  double-count behavior.
- Reuse the platform mock (global setup) — do **not** add `vi.mock('./platform/mock.js')`.

### #6 — browser viewport args (puppeteer stale comment + playwright real bug)

**Key architectural fact:** `viewport` is part of `BrowserSettings` and is passed to
**`setup()`** (browser creation), *once*. `WindowSettings` (passed to `newWindow`) is only
`{ pageId, scripts, url }` — **no viewport**. A `newWindow` is a tab. So viewport must be set at
**browser creation**, not per window.

#### 6a — puppeteer (`browsers/puppeteer.ts:24`) → remove stale comment

The comment `// TODO maximize should not be set when viewport is set` is **stale**. Git blame:
the comment is from 2026-08-04, but the ternary that implements exactly this
(`settings.viewport ? '--window-size=w,h' : '--start-maximized'`, line ~26) was written later
(2026-09-21). The code already does what the TODO asks.

**Step:** delete the `// TODO maximize should not be set when viewport is set` line at
`puppeteer.ts:24`. No behavior change, no tests.

#### 6b — playwright (`browsers/playwright.ts:25`) → implement viewport via explicit context

**The bug:** playwright's `launchAndInstallIfNeeded` passes only `getExtraChromeArguments()` and
**never uses `settings.viewport`** (grep-confirmed: viewport is used nowhere in the file). So
`--browser-viewport-width/height` is **silently ignored** under the playwright driver.

**Decision (chosen):** use playwright's idiomatic viewport knob — an explicit
`browser.newContext({ viewport })` created at `setup` time — rather than chromium launch args.
The TODO text ("define args for chrome") points at the *wrong* mechanism for playwright.

**Implementation steps (for the implementer LLM):**
1. Add a module-level `let context: BrowserContext | undefined;` alongside `let browser`.
2. In `launchAndInstallIfNeeded(settings)`, after the browser is launched (both the initial and
   the post-install `chromium.launch(...)` paths), create the context:
   ```ts
   context = await browser.newContext({
     viewport: settings.viewport ?? null // null = no fixed viewport (use window size)
   });
   ```
   Remove the `// TODO define args for chrome` comment. Keep `getExtraChromeArguments()` on
   `launch` as-is (that env-var passthrough is orthogonal to viewport).
3. In `newWindow`, create pages from the explicit context for **all** windows:
   `page = await context?.newPage();`. This likely **removes the `isFirstWindow` branch** — that
   branch existed to reuse the auto-created default context's blank page (see
   `puppeteer.ts` `pages(true)[0]` / commit `5219e398`); with our own explicit context there is
   no such page to reuse. **Implementer must verify**: after switching to a dedicated context,
   the browser's *default* context still holds an orphan blank page — decide whether to leave it
   (harmless, closed on `browser.close()`) or close the default context. Prefer the simplest
   correct option; do not over-engineer.
4. `shutdown()`: `browser.close()` already closes child contexts, so it can stay. Optionally
   `await context?.close()` first for symmetry — implementer's call.

**Behavioral note (document, don't over-engineer):** puppeteer's *no-viewport* path uses
`--start-maximized` (grow the OS window in headed mode). Playwright's `viewport: null` means "no
fixed viewport / use window size" but does **not** maximize the window in headed mode. For the
default headless mode this is equivalent; the only divergence is headed + no-viewport (window not
auto-maximized). Acceptable minor difference. If headed maximize parity is later wanted, add
`--start-maximized` to `launch` args only for the `visible && !viewport` case — out of scope here.

**Tests:**
- Browser behavior is covered by the integration-style `src/browsers/browsers.spec.ts` (launches
  real browsers, gated by the `BROWSERS_TEST` env var) and driver selection by
  `src/browsers/factory.spec.ts`. There is no unit test mocking `chromium.launch`/context
  internals. Verify the playwright viewport path via the existing playwright suite in
  `browsers.spec.ts` (add/extend a case asserting the rendered viewport matches
  `--browser-viewport-width/height` when set). Follow existing spec conventions; reuse the
  global platform mock.

### #7 — `sap-ui-version.json` fetch/log only when tests run locally

**File:** `src/modes/test/index.ts` (verified current: TODO + fetch at **lines 34–43**; the
`serveOnly` early-return block at **lines 45–56**; `if (!configuration.url) { configuration.url =
[...] }` at **lines 58–60**; `const urls = configuration.url.map(...)` at **line 62**).

**Problem.** Right after `Server.start`, the code unconditionally does:

```ts
// TODO: only when local is being used
const version = JSON.parse(await Http.getAsText(`http://localhost:${port}/resources/sap-ui-version.json`)) as {
  libraries: { name: string; version: string }[];
};
const { version: coreVersion } = version.libraries.find(({ name }) => name === 'sap.ui.core') ?? { version: 'unknown' };
logger.info({ source: 'job', message: `UI5 version used by the local server: ${coreVersion}` });
```

This reflects the **local reserve server's** UI5 (webapp files, else the `ui5` CDN proxy). When the
user tests a **remote** app via `--url https://host/...`, that page's UI5 comes from the remote
server — **not** from our local server — so the logged "UI5 version used by the local server" is
misleading noise and the HTTP round-trip is pointless.

**Why `--url` is the discriminator.** The synthesized testsuite URL (no `--url` given) is built as
`http://localhost:0/...` (line ~57) and rewritten to `:${port}/` (line ~60), so it's served by our
server. User-supplied `--url` values are **left untouched** by that rewrite — they keep their
original host. Hence: a resolved page URL on a **loopback host** ⇔ served by us ⇔ the local version
is meaningful.

**Decisions (agreed):**
- **Detection:** loopback **hostname** — `'localhost' | '127.0.0.1' | '::1'` (via `new URL(u).hostname`).
  This directly matches "the URL looks like localhost" and also correctly includes a user who
  explicitly passes `--url http://localhost:${port}/...`.
- **Scope:** `some()` — if **any** tested URL is local, log the version (mixed local+remote runs
  still get the local server's version).

**Placement change (required).** The fetch currently sits at lines 34–43, **before** URLs are
resolved. It must **move to after the `urls` array is built** — i.e. after **line 62**
(`const urls = configuration.url.map(...)`), so the guard can inspect the *resolved* page URLs.
Keep it before `setupBrowser`/`parallelize`. (Note: `configuration.url` is guaranteed defined by
the `if (!configuration.url)` block at lines 58–60, so `configuration.url.map` at line 62 is
safe.)

> Note: the `serveOnly` early-return block (lines 45–56) is **before** URL resolution. Moving the
> version fetch to after line 60 means it no longer runs in `serveOnly` mode. That is acceptable /
> arguably better (serve-only doesn't test anything), but the implementer should be aware the log
> line disappears from serve-only output. If serve-only should still log the version, that's a
> separate decision — do **not** add it back speculatively.

**Implementation sketch** (place right after `const urls = ...`):

```ts
const urls = configuration.url.map((url) => url.replace(':0/', () => `:${port}/`));

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const isLocalUrl = (url: string): boolean => {
  try {
    return LOOPBACK_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
};
if (urls.some(isLocalUrl)) {
  const version = JSON.parse(await Http.getAsText(`http://localhost:${port}/resources/sap-ui-version.json`)) as {
    libraries: { name: string; version: string }[];
  };
  const { version: coreVersion } = version.libraries.find(({ name }) => name === 'sap.ui.core') ?? {
    version: 'unknown'
  };
  logger.info({ source: 'job', message: `UI5 version used by the local server: ${coreVersion}` });
}
```

Notes for the implementer:
- Remove the `// TODO: only when local is being used` comment.
- `new URL(...).hostname` returns IPv6 **without** brackets, so compare against `'::1'` (not
  `'[::1]'`). The `try/catch` guards a malformed URL (shouldn't happen post-resolution, but cheap).
- Match the surrounding style; extract the `LOOPBACK_HOSTS`/`isLocalUrl` helper to module scope if it
  reads cleaner, or inline if a single use. Do not over-engineer (no new option, no config flag).
- The JSON shape / `sap.ui.core` lookup / log message are **unchanged** — only the gating and the
  block's position change.

**Tests.** Test-mode has a unit-test plan (`test_plan.md`, see memory `reference_test_mode_coverage_plan`).
The version-fetch gating is best asserted at the `test()` integration level with `Http` mocked:
- local run (no `--url`, or `--url http://localhost:.../`) → `Http.getAsText` called with the
  `sap-ui-version.json` URL and the "UI5 version used by the local server" info logged;
- remote run (`--url https://host/...`) → **not** called, **not** logged.
Follow existing spec conventions (global platform mock, UPPER_SNAKE_CASE constants); reuse whatever
`Http` mock helper the test-mode specs already use rather than adding `vi.mock` for the platform.

### #8 — `modes/log/index.ts:87` → WONTFIX (stale comment, already implemented)

**File:** `src/modes/log/index.ts:87`.

The comment `// TODO: pass the abort signal here` sits directly above:

```ts
for await (const item of LogReader.read(logFileName, abortSignal)) {
```

The signal is **already passed and fully honored** end-to-end:

- `index.ts:88` — `LogReader.read(logFileName, abortSignal)`;
- `LogReader.read(logFileName, signal?)` forwards it: `stream.read(signal)` (`LogReader.ts:20,24`);
- `FramedStreamReader.read(signal?)` registers an `abort` listener and races it against the poll
  sleep (`Promise.race([Process.sleep(...), abortSignal])`) to break the tail-follow loop
  (`FramedStreamReader.ts:84–105`).

**Git blame proves it's just a leftover** (all `2026-03-27`, same author):
- `23:23` `a7c5c7e9` — TODO comment introduced.
- `23:32` `555a7b9d` — `signal?: AbortSignal` param added to `LogReader.read`.
- `23:33` `c69f313d` — `abortSignal` passed at the `index.ts` call site.

The work was done ~10 minutes later; the comment was never removed.

**Only action:** delete the `// TODO: pass the abort signal here` line at `index.ts:87`. No behavior
change, no tests. (Same shape as #3 and #6a stale-comment removals.)

### #12 — `platform/logger.ts:17` → explain the `channel` init invariant, keep a comment

**File:** `src/platform/logger.ts:17`.

The comment worries:

```ts
// TODO understand why channel does not appear as a problem as it might be used before being defined
let channel: ReturnType<typeof Thread.createBroadcastChannel>;
```

`channel` is declared with **no initializer** and is only assigned inside `start()`
(`channel = Thread.createBroadcastChannel('logger')`, line ~38). Several sites read it with a bare
`channel.` (would throw if `undefined`), yet it's never a runtime problem.

**Why it's safe (the answer to the TODO).** Every bare `channel.` access is transitively gated
behind `start()` having run:

- Bare reads live at: `channel.onmessage = …` and inside that handler (lines ~55, 65, 78); `log()`
  line ~89; `fatal()` worker branch line ~152; `stop()` lines ~173, 175. (Line ~31 in
  `terminalResized` already uses optional chaining `channel?.`, so it's safe regardless.)
- **Worker threads:** `start()` runs **unconditionally at module load** (`if (!Thread.isMainThread) { start(); }`,
  lines ~99–101), before any exported `logger.*` method can be invoked by an importer. So in a worker
  `channel` is always assigned first.
- **Main thread:** `isReady` starts `false` (line ~23 sets it `true` only for non-main threads), so
  the eager `log()` path (line ~83) takes the **buffering** branch (`buffer.push(...)`) and does
  **not** touch `channel` until `isReady` flips true. `isReady` only flips inside the `onmessage`
  `ready` handler — which itself only exists after `start()` assigned both `channel` and the handler.
  The other bare-access methods (`stop`, and the worker-only branch of `fatal`) are reachable only
  after `logger.start()` — which calls `start()` (line ~109) **before** creating the workers — or are
  main-thread-guarded (`fatal` uses `Exit.shutdown()` on main, `channel` only on the worker branch).

So there is no execution path where a bare `channel.` runs before `channel` is assigned. The TODO's
fear is real in the abstract but prevented by init ordering + the `isReady`/buffer gate.

**Decision (agreed): explain + keep comment.** Replace the anxious TODO with a concise invariant
comment so a future reader doesn't re-investigate. Suggested replacement:

```ts
// `channel` is assigned in start(): workers call start() at module load (below); on the main
// thread every bare `channel.` access is reachable only after logger.start() -> start(), and the
// eager log() path buffers until isReady (set by the ready message, which start() wires up). So it
// is never read before assignment.
let channel: ReturnType<typeof Thread.createBroadcastChannel>;
```

**Do NOT** change code (no added guards, no widening to `channel?.` everywhere) — the invariant holds
and hardening would only mask a future regression. Keep it a comment-only change.

**No tests.** Documentation-only; behavior is unchanged. (If the CODING_GUIDELINES audit — memory
`project_audit_progress` — tracks TODO/comment cleanups, note it there when implemented.)

### #11 — `platform/Exit.ts:161` → WONTFIX, delete the exploratory TODO

**File:** `src/platform/Exit.ts:161`, inside the `shutdown()` LIFO drain loop:

```ts
while (this._asyncTasks.length > 0) {
  const task = this._asyncTasks.at(-1)!;      // peek tail
  try {
    logger?.[logLevel]({ source: 'exit', message: `Stopping ${task.name}...` });
    // TODO: can we wait for task to be unregistered ?
    await task.stop();
    logger?.[logLevel]({ source: 'exit', message: `${task.name} stopped.` });
  } catch (error) { … }
  finally {
    if (task === this._asyncTasks.at(-1)) {   // pop only if still the tail
      this._asyncTasks.pop();
    }
  }
}
```

**What the TODO asks.** `await task.stop()` waits for the `stop()` callback to resolve — not for the
task owner to actually **unregister** (its `[Symbol.dispose]` splice). Could `shutdown()` instead wait
for unregistration, making the owner the single removal authority and dropping the loop's
pop-if-still-tail guard?

**Answer: no — it cannot be a universal rule, so WONTFIX.** Registration is a **mix**:

- `using`-scoped (dispose runs on scope exit): `pageTask.ts:227`, `Http.ts:19`, `Http.ts:62`.
- **Bare** (handle captured/ignored, **not** disposed during shutdown): `browser.ts:39`,
  `index.ts:47` (serveOnly), `Server.ts:32`, `mcp/index.ts:19`, `log/index.ts:65`, `Process.ts:64`,
  `FramedStreamReader.ts:86`, `factory.ts:78`.

For every **bare** task, nothing ever calls `[Symbol.dispose]` during shutdown — `stop()` resolving is
the *only* completion signal. If `shutdown()` waited for unregistration, it would **hang forever** on
each of those tasks. So "wait for unregistration" is unimplementable as a general contract.

**The current design is already race-safe** (and matches ADR-0010, *Graceful Shutdown*):

- `stop()` resolution is the completion contract; the loop then does the authoritative removal
  (`pop()`), guarded by `task === this._asyncTasks.at(-1)` so it never pops the wrong entry if a
  `using`-scoped task disposed itself in the interim (or the array shifted).
- The dispose assert is deliberately lenient during shutdown:
  `assert(Exit._enteringShutdown || index !== -1, …)` (lines ~135–138) — a "not found" dispose after
  the loop already popped is expected and ignored. Removal is therefore **idempotent** across both
  paths.

ADR-0010 documents this model (LIFO drain, `stop()` as the signal, post-shutdown `registerAsyncTask`
throwing `ExitShutdownError`) and does **not** list "wait for unregistration" as part of the contract.
The `stop()`-then-guarded-pop is the intended, working design.

**Only action:** delete the `// TODO: can we wait for task to be unregistered ?` line (Exit.ts:161).

- **No replacement comment needed** — unlike #12, the "why" is already captured by ADR-0010; a fresh
  reader is pointed there. (If the implementer feels a one-liner helps, a terse
  `// stop() is the completion signal; not all tasks unregister during shutdown (see ADR-0010)` is
  acceptable but optional.)
- **No code change, no tests.** Behavior is unchanged. (Same stale-comment cleanup family as #3, #8,
  #6a; note in the audit — memory `project_audit_progress` — when implemented.)

### #13 — `agent/opaIframeCoverage.ts:3` → WONTFIX, delete the exploratory TODO

**File:** `src/agent/opaIframeCoverage.ts:3`.

```ts
import { IS_IN_IFRAME } from './contants.js';

// TODO: how to make sure it is added to each IFrame ?

export const setCoverageHandler = (window: Window) => {
  const top = window.top!; // not null in IFrame
  Object.defineProperty(window, '__coverage__', {
    get() { return top.__coverage__; },
    set(value) { top.__coverage__ = value; return true; }
  });
};

/* v8 ignore next -- @preserve */
if (IS_IN_IFRAME) {
  setCoverageHandler(window);
}
```

**What it does.** When code runs inside an OPA iframe, it replaces the iframe's `window.__coverage__`
with a proxy onto `top.__coverage__`, so instrumented app code accumulating coverage in the iframe
merges into the **top** page's coverage object — which is what the collector reads
(`modes/test/coverage/collect.ts:34` → `page.eval('window.__coverage__')`).

**Why the TODO is a non-issue — "added to each IFrame" is guaranteed by construction.**

1. This module is imported by the agent bundle entry (`agent/index.ts:1` — `import './opaIframeCoverage.js'`).
2. The agent bundle is injected into pages by the browser drivers via **init scripts**:
   - playwright: `page.addInitScript(script)` (`browsers/playwright.ts:77`);
   - puppeteer: `page.evaluateOnNewDocument(script)` (`browsers/puppeteer.ts:89`).
   Both APIs run the script in the page **and every (sub-)frame** created in it — including OPA
   iframes — by design.
3. So the module executes in each frame; the `if (IS_IN_IFRAME)` guard (`IS_IN_IFRAME` derived from
   `window !== top` in `agent/contants.ts`) makes it self-install the proxy **only** in iframes,
   exactly once per frame. There is no manual "add to each iframe" step to get right.

**Scope / caveat (document, don't fix).** `setCoverageHandler` uses `window.top!` and reads/writes
`top.__coverage__`. This requires the iframe to be **same-origin** with the top page. OPA's
`iStartMyAppInAFrame` / `iStartMyUIComponent` load the app under test from the **same** local test
server, so they are same-origin and this works. A hypothetical cross-origin iframe would throw a
`SecurityError` on `top` access — but that's outside the supported coverage scenario. The chosen
resolution is **not** to add cross-origin handling (would be dead code for the supported use case).

**Decision (agreed): delete comment only.** The injection mechanism answers the question; there's no
ADR to point at and the same-origin scope is implicit in how OPA runs. Keep it clean.

- **Only action:** delete the `// TODO: how to make sure it is added to each IFrame ?` line
  (opaIframeCoverage.ts:3).
- **No replacement comment, no code change, no tests.** Behavior unchanged. (Same stale-comment
  cleanup family as #3, #8, #6a, #11; note in the audit — memory `project_audit_progress` — when
  implemented.)

### #10 — `Npm.ts:23` `detached: true` → enforce the detached↔kill contract (warn on fallback)

**Files:** `src/Npm.ts:23` (the TODO) and `src/platform/Process.ts` (`Process.kill`, the enforcement).

**Why `detached: true` is correct (the answer to "better?").** `npm('...')` spawns
`node npm-cli.js …` with `detached: true`. On **POSIX** that makes the child a **process-group
leader** (its pgid == pid). `Process.kill()`'s POSIX branch then does:

```ts
try {
  process.kill(-this.pid);   // negative pid = signal the whole PROCESS GROUP
} catch {
  process.kill(this.pid);    // fallback: signal only the direct child
}
```

Killing the group (`-pid`) is what reaps npm's **install subtree** (npm forks the actual installers,
lifecycle scripts, etc.) on timeout/shutdown. Without `detached`, the child is **not** a group
leader, `kill(-pid)` throws `ESRCH`, and the fallback kills only the npm process — **orphaning its
children silently**. So `detached: true` is load-bearing, not incidental.

On **Windows**, `detached` is irrelevant to teardown: `Process.kill()` uses a separate branch
(`taskkill /F /T /PID`) that reaps the tree regardless. (Windows `detached` merely spawns a new
console, suppressed by `windowsHide`.)

**The real problem (user's insight).** `detached` and `kill(-pid)` are **two halves of one contract**
that live in **different files** and are wired up by hand at each call site — so it's easy to forget.
It already appears forgotten: `batchTask.ts:84` spawns a full child runner (`node cli.js`, which
itself launches browsers/servers) **without** `detached`, so killing a batch child on shutdown would
orphan its subtree. `detached: true` is set at `Npm.ts:23`, `start.ts:77`,
`coverage/instrument.ts:37,59`, `coverage/report.ts:22,62` — and omitted at
`getNpmCliPath` (short-lived, never killed — fine), `end.ts:16`, `mcp/tools/run.ts:20`,
`batchTask.ts:84`.

**Decision (agreed): enforce, don't default.** Do **not** hardcode `detached: true` in
`Process.spawn` (blanket default has Windows/IPC blast radius — `batchTask` uses `onMessage`⇒`ipc`
stdio, and `detached`+new-console+`windowsHide` on Windows is an unverified interaction). Instead make
the contract **self-checking at kill time** (agreed mechanism: **warn on the kill fallback**).

**Implementation — `Process.kill()` POSIX branch (`Process.ts` ~190–197):**

```ts
} else {
  try {
    // Requires the child to be a process-group leader (spawned with detached:true),
    // so the whole subtree is reaped. See Npm.ts / start.ts / coverage spawns.
    process.kill(-this.pid);
  } catch {
    // Group kill failed: either the child was NOT detached (subtree may be orphaned)
    // or the group is already gone (normal race). Fall back to killing the pid only.
    logger.warn({
      source: 'process',
      processId: this.pid,
      message: 'group kill failed; killing pid only — if this process spawned children, they may be orphaned (was it spawned with detached:true?)'
    });
    try {
      process.kill(this.pid);
    } catch {
      // already dead
    }
  }
}
```

Notes for the implementer:
- **Wording matters:** `kill(-pid)` throws `ESRCH` **both** when the child wasn't a group leader
  **and** when the group already exited (a clean, common race). So the message must be phrased as a
  *possibility* ("may be orphaned", "was it spawned with detached:true?") — mirror the existing
  "possible leak" tone in `Exit.ts`. Do **not** make it an `error`/`fatal`; a WARN is the agreed
  severity (non-fatal safety net).
- Keep the inner `kill(this.pid)` wrapped so a genuinely-already-dead process doesn't throw out of
  `kill()` (the current `catch {}` swallows everything; preserve that behavior).
- Do **not** add a spawn-time assert (that option was rejected — too strict, and it would fire on the
  legitimately-non-detached short-lived spawns like `getNpmCliPath`).

**`Npm.ts:23` — replace the TODO with a comment** documenting the coupling:

```ts
return Process.spawn('node', [npmCliPath, ...arguments_], {
  // detached ⇒ child is a process-group leader so Process.kill() can reap npm's install
  // subtree via kill(-pid) on POSIX (see Process.kill). Required, not optional.
  detached: true
});
```

**Out of scope (mention, don't do):** actually adding `detached: true` to `batchTask.ts:84` /
`end.ts` / `mcp/tools/run.ts` is a **separate** correctness fix surfaced by this investigation — the
new WARN will make those omissions visible in logs first. Note it as a follow-up rather than bundling
it here (each needs its own think re: IPC/Windows). Consider recording the detached↔kill invariant in
ADR-0010 as a follow-up too, since it governs every kill-able spawn.

**Tests.**
- `Process.spec.ts`: add a case asserting that when the group kill throws, `kill` falls back to
  `process.kill(this.pid)` **and** logs the WARN (spy on `logger.warn`; mock `process.kill` to throw
  on the negative-pid call, succeed on the positive). Guard/skip on Windows (that branch uses
  `taskkill`). Follow existing spec conventions (global platform mock, UPPER_SNAKE_CASE constants).
- `Npm.ts` comment change is non-behavioral — no test.
- Note the comment/enforcement in the audit (memory `project_audit_progress`) when implemented.

### #14 — `Npm.ts:89` `check if package.json is required here` → simplify to a directory base

**File:** `src/Npm.ts:88–92`, inside `tryImportFromPath`:

```ts
try {
  // TODO: check if package.json is required here
  const require = Module.createRequire(Url.pathToFileURL(Path.join(configuration.cwd, 'package.json')).href);
  const resolved = require.resolve(moduleName, { paths: [nodeModulesPath] });
  return await this.dynamicImport(Url.pathToFileURL(resolved).href);
} catch {
  return undefined;
}
```

**Verified answer: `package.json` is NOT required** (Node repro, this machine):

- `createRequire(<non-existent .../package.json>)` does **not** throw — Node uses the argument only as
  a resolution anchor, not as a file that must exist.
- `require.resolve(moduleName, { paths: [nodeModulesPath] })` passes `paths` **explicitly**, so
  resolution is anchored at `nodeModulesPath`; the `createRequire` base is irrelevant to the result.
  Resolving `typescript` produced the identical path with a real `package.json` base, a non-existent
  `package.json` base, and a trailing-slash **directory** base (`file://…/ui5-test-runner/`).

So the `'package.json'` filename segment is misleading — it implies a dependency on a file that isn't
needed and isn't checked.

**Decision (agreed): simplify to a directory base.** Use a trailing-slash directory URL under
`cwd` as the `createRequire` anchor instead of a `package.json` path. Documents the finding by
construction and removes the misleading filename.

> Note on the sibling idiom: `listPackageScriptNames` (`Npm.ts:233`) builds a trailing-slash
> directory URL as `` `${Url.pathToFileURL(cwd).href}/` `` — but it feeds it to
> `Module.findPackageJSON(...)`, **not** `createRequire`. Reuse only the **URL-building idiom**
> (`` `${Url.pathToFileURL(configuration.cwd).href}/` ``), not the `findPackageJSON` call. This
> idiom is preferred over `Path.join(configuration.cwd, '/')` because `Path.join` may strip the
> trailing slash on some platforms, whereas string-appending `/` to the `file://…` href is
> deterministic.

**Change:**

```ts
try {
  // The base only anchors resolution; require.resolve uses the explicit `paths` below, so a
  // directory URL under cwd is sufficient (no package.json needs to exist here).
  const require = Module.createRequire(`${Url.pathToFileURL(configuration.cwd).href}/`);
  const resolved = require.resolve(moduleName, { paths: [nodeModulesPath] });
  return await this.dynamicImport(Url.pathToFileURL(resolved).href);
} catch {
  return undefined;
}
```

Notes for the implementer:
- The base must be a **directory URL ending in `/`**. Build it by string-appending `/` to the
  `file://…` href: `` `${Url.pathToFileURL(configuration.cwd).href}/` `` (the URL-building half of
  the `Npm.ts:233` idiom). Do **not** use `Path.join(configuration.cwd, '/')` — `Path.join` may
  drop the trailing slash.
- `Path` is no longer needed for this line, but is still imported/used elsewhere in `Npm.ts` — do
  **not** remove the import.
- Remove the `// TODO: check if package.json is required here` comment; the short replacement comment
  above records the finding.
- Behavior is unchanged (resolution result is identical) — this is a clarity cleanup, not a fix.

**Tests.** `Npm.spec.ts` already exercises `tryImportFromPath` via `Npm.import`/`resolvePackageDir`
paths. No new test is strictly required (behavior identical), but if a quick guard is cheap, assert
that `import`/resolution still succeeds when `cwd` has **no** `package.json` (the case the old filename
falsely implied mattered). Follow existing spec conventions (global platform mock, UPPER_SNAKE_CASE
constants; `getRoots` is memoized — see #4's note). Note in the audit (memory
`project_audit_progress`) when implemented.

### #15 — `batchTask.ts:40` batch-forward re-serialization of complex options

> **⚠️ ESCALATE TO A STRONGER MODEL — do not implement this item on a cheaper model unsupervised.**
> Unlike the other items (turn-the-crank, verified snippets), #15 needs judgment a cheaper model is
> likely to get subtly wrong:
> - The round-trip invariant is **string-level fixed-point**, not identity deep-equal — because
>   `library-mapping` normalizes `sourceFolder` via `fsOption` (filesystem). A model that reflexively
>   writes `expect(reparsed).toEqual(sample)` will produce a test that fails on the canonical example
>   and then "fixes" it by weakening the assertion into meaninglessness. See §3 for the correct shape.
> - The runtime backstop calls an **async** validator inside a per-item loop; getting the
>   `await`/`configuration` plumbing right (and deciding whether the `fsOption` filesystem touch is
>   acceptable at forward time) is a design call, not a mechanical edit.
> - This is **forward-looking infrastructure** (`lib` isn't `batchForwarded` yet), so there's no
>   failing behavior to anchor against — correctness rests entirely on the invariant being right.
>
> **If the round-trip assertion turns out unstable** (e.g. `fsOption` proves non-idempotent, or a
> type resists string-level fixed-point): **stop and escalate** rather than relaxing the assertion.
> A weakened invariant silently reintroduces the exact `[object Object]` corruption this item exists
> to prevent. The whole point of the CI test is to *fail loud before merge* — do not defeat it to
> make the suite green.

**File:** `src/modes/batch/batchTask.ts` — `buildForwardedParameters` (verified current: lines
20–45; the `// TODO: some options might need a rewrite` is at **line 38**, inside the scalar
`else` branch at lines 37–43).

**⚠️ Verified — the single-value validator entry point (removes the plan's "implementer must
find" step).** One option value is validated by indexing the validators map:
`src/configuration/validators/index.ts` exports
`validators: { [key in OptionType]: OptionValidator<key> }`, and a single value is validated by
calling `validators[option.type](option, value, configuration)`. Signature
(`validators/OptionValidator.ts`): `(option, value, configuration) => Promise<Inferred> | Inferred`
— **may be async** (e.g. `library-mapping`). This is the exact function the round-trip test and
the runtime backstop must call. The `multiple` handling in configuration parsing wraps a per-item
call to this same function, so re-validating **one item** is correct.

**Context.** Batch mode spawns a child `node cli …` per batch item and re-passes the parent's
`batchForwarded` options on the child's command line, but **only** those whose source is `'cli'`
(`configuration.sources[name] === 'cli'`, line 25). The current loop stringifies each value by type:

```ts
if (option.type === 'boolean')      parameters.push(flag, String(value));
else if (option.type === 'json')    parameters.push(flag, JSON.stringify(value));
else if (option.multiple)           for (const item of value) parameters.push(flag, item); // <-- raw item
else /* scalar */                   parameters.push(flag, `${value}`);   // <-- TODO here
```

**The bug class.** Options deserialize **string → value** on the way *in* (validators), but forwarding
needs **value → string** on the way *out*. Only `json` (via `JSON.stringify`) and the trivially-equal
scalar types round-trip. A type whose **parsed form ≠ its CLI text** breaks:

- **`library-mapping` (`lib`)** — validator turns `"<rel>=<path>"` into
  `{ resourcesSubFolder, sourceFolder }` (see `validators/libraryMapping.ts`). It is `multiple: yes`,
  so it hits the **`multiple` branch** and pushes the **object** as an arg → `Process.spawn` receives
  `[object Object]` (or throws). **So the TODO comment is slightly mislocated**: the real break is the
  `multiple` branch (line ~36), not only the scalar `else` (line 40).
- **`regexp` (`pageFilter`, currently forwarded)** — validator stores a **`RegExp`**;
  `` `${/foo/gi}` `` = `"/foo/gi"`, which the validator's `^\/(.+)\/(\w*)$` branch happens to re-parse
  correctly. It **round-trips by luck** today — fragile, not designed.

**Latent, by design confirmation.** Listing `batchForwarded` options today: none is
`library-mapping`; the only non-trivial one is `regexp`/`pageFilter` (round-trips by luck). So nothing
is broken **now** — but the moment `lib` (or any complex type) gains `batchForwarded`, forwarding
silently corrupts. The goal (per user) is to make forwarding **correct by construction** and to make a
missing case **fail before merge**, not silently.

**Design (agreed): default serializer + optional per-type override, proven by a CI round-trip
invariant, with a runtime `assert` backstop.**

Rationale for this shape (rejected alternatives): a full per-type serializer for *every* type is
overkill (most are `` `${value}` ``); exhaustive hand-branches are fragile (easy to forget one);
remembering the original CLI string fails for **config-file-sourced** values; pure fail-loud is the
outcome we want to avoid as the *primary* path. This design keeps per-type code minimal, and the CI
test — not human vigilance — is what guarantees completeness.

**1. Default serializer + opt-in override.**

```ts
// default: trivially faithful for string/integer/timeout/enumeration/fs-entry (and RegExp via `${}`)
const defaultSerialize = (value: unknown): string => `${value}`;

// Optional per-type override, keyed by OptionType, ONLY for types whose parsed form != CLI text.
// e.g. library-mapping: value -> `${resourcesSubFolder}=${sourceFolder}`
const serializers: Partial<Record<OptionType, (value: unknown) => string>> = {
  'library-mapping': (v) => {
    const { resourcesSubFolder, sourceFolder } = v as { resourcesSubFolder: string; sourceFolder: string };
    return `${resourcesSubFolder}=${sourceFolder}`;
  }
};
const serialize = (type: OptionType, value: unknown): string => (serializers[type] ?? defaultSerialize)(value);
```

Imports needed in `batchTask.ts`: `OptionType` from `../../configuration/Option.js`; `validators`
from `../../configuration/validators/index.js` (for the backstop); `assert` is already available
via `../../platform/index.js` (already imported — see top of file).

**2. Rework the loop so every value (scalar or array item) flows through `serialize`** — this closes
the `multiple`-branch hole. `boolean` and `json` keep their dedicated handling (already correct):

```ts
const pushValue = (option, flag, value) => {
  const str = serialize(option.type, value);
  // runtime backstop (see #3)
  parameters.push(flag, str);
};

if (option.type === 'boolean')   parameters.push(flag, String(value));
else if (option.type === 'json') parameters.push(flag, JSON.stringify(value));
else if (option.multiple)        for (const item of value as unknown[]) pushValue(option, flag, item);
else                             pushValue(option, flag, value);
```

**3. Runtime backstop (`assert`, unreachable if CI is green).** In `pushValue`, after serializing,
re-validate and compare against the original.

**⚠️ Verified pitfall — `library-mapping` does NOT round-trip by naïve deep-equal.** The `lib`
validator (`validators/libraryMapping.ts:11–30`) runs `sourceFolder` through
`fsOption(option, sourceFolder, configuration)` — a **filesystem-touching** resolution that
rewrites `sourceFolder` to a validated/absolute path. So for input
`{ resourcesSubFolder: 'x', sourceFolder: 'y' }`, `validate(serialize(value))` returns
`{ resourcesSubFolder: 'x', sourceFolder: '<resolved-absolute-y>' }` — **deep-unequal to the
input**, and the `fsOption` call may even throw if `y` doesn't exist. This breaks the naïve
`toEqual(sample)` assertion in both the backstop and the CI test below.

**Resolution (choose one, decide at implementation):**
- **(a) Round-trip stability, not identity (recommended).** Assert `validate → serialize →
  validate` reaches a **fixed point**: `serialize(v1) === serialize(v2)` where
  `v1 = validate(str)` and `v2 = validate(serialize(v1))`. This tolerates one-way normalization
  (`fsOption`) — what matters for forwarding is that the *serialized string* is stable, not that
  the parsed object is identical. This is the correct invariant for the actual goal (the child
  gets an arg that re-parses to the same thing the parent has).
- **(b) Compare the serialized strings directly.** `serialize(validate(serialize(sample))) ===
  serialize(sample)` — equivalent framing of (a), avoids deep-equal on objects entirely.

Use string-level comparison (a/b), **not** `deepEqual(reparsed, value)`. Prefer (b) — simplest.

```ts
// str = serialize(option.type, value) for one item
const reparsed = await validators[option.type](option, str, configuration);
assert(serialize(option.type, reparsed) === str,
  `batch forward: '${option.name}' does not round-trip ('${str}')`);
```

- `assert` fatally stops the command (`logger.fatal` → shutdown; see CODING_GUIDELINES / #4 notes) —
  acceptable because it is unreachable when the CI invariant passes, and it names the offending option.

**4. CI invariant test (the primary guarantee).** New spec (e.g. `batchTask.spec.ts` or a dedicated
`configuration/forwarding.spec.ts`) that iterates **every** `batchForwarded` option and asserts the
**string-level** round-trip (fixed point — see the pitfall in §3, `library-mapping` normalizes via
`fsOption`, so identity deep-equal is wrong):

```
for each option in options.filter(o => o.batchForwarded):
  for each sample in SAMPLES_FOR[option.type]:      // representative parsed values
    str1 = serialize(option.type, sample)
    v    = await validators[option.type](option, str1, configuration)   // re-parse
    str2 = serialize(option.type, v)
    expect(str2).toBe(str1)                          // serialized form is stable
```

- Provide `SAMPLES_FOR` per `OptionType` (UPPER_SNAKE_CASE constant): e.g. `regexp` →
  `[/foo/, /a\/b/gi]` (include a slash-containing pattern to stress the round-trip), `integer` →
  `[0, 42]`, `timeout` → `[1000]`, `enumeration`/`string`/`fs-entry` → representative strings,
  `boolean`/`json` covered by their own branches.
- **`library-mapping` sample + `fsOption`:** the `lib` validator calls
  `fsOption(option, sourceFolder, configuration)`, which touches the filesystem and may reject a
  non-existent path. Two options: (i) use a `sourceFolder` that exists in the test context (e.g.
  the repo root / `configuration.cwd`), or (ii) mock `fsOption` (or point `configuration.cwd` at a
  fixture dir) so validation resolves deterministically. Because the assertion is **string-level**
  (`str2 === str1`), and the `library-mapping` serializer is
  `` `${resourcesSubFolder}=${sourceFolder}` ``, the test passes as long as `fsOption` returns a
  value whose re-serialization equals the first serialization — i.e. `fsOption` is idempotent on
  an already-resolved path (verify, or pre-resolve the sample). Follow
  `validators/libraryMapping.spec.ts` for how that suite already sets up `fsOption`/`cwd`.
- **Effect:** if someone marks a new complex option `batchForwarded` without a matching `serialize`,
  this test **fails in CI** — the "fail before merge, not in production" guarantee the user wants.
- Follow test conventions (memory `feedback_test_conventions`, `feedback_platform_mock`): global
  platform mock, UPPER_SNAKE_CASE constants, no `vi.mock('./platform/mock.js')`.

**5. Docs / follow-up.** When implemented, note in the audit (memory `project_audit_progress`).
Consider a one-line note in the batch mode ADR (ADR-0006) that `batchForwarded` complex types require a
`serialize` + are covered by the round-trip invariant. Remove the `// TODO: some options might need a
rewrite` comment.

**Scope guard.** This is **infrastructure for a case that doesn't exist yet** (`lib` isn't forwarded).
Keep the implementation minimal: default serializer + the one `library-mapping` serializer as the
worked example (even though `lib` isn't forwarded, it's the canonical complex type and makes the CI
test meaningful) + the CI invariant + a modest runtime backstop. Do not add serializers for types that
already round-trip via `${value}`.





