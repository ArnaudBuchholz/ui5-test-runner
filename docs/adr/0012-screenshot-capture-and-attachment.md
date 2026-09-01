# ADR-0012: Screenshot Capture and Attachment Architecture

## Status
Accepted

## Context

The `screenshot` option causes the runner to take a screenshot after every OPA assertion, and `screenshotOnFailure` takes a screenshot when a test fails. Before this ADR, the implementation had two structural problems:

1. **The runner decided the screenshot filename** — `pageId`, `currentTestId`, and `currentLogIndex` were threaded through `AgentState` so the runner could construct `${pageId}-${testId}-${logIndex}.png`. This violates the Agent/Runner boundary rule in `CODING_GUIDELINES.md`: *"Decisions that depend on browser-side state must be made in the agent, not threaded through `AgentState` to the runner."* The filename is 100% derived from browser-side knowledge (which test, which assertion).

2. **Per-assertion screenshots were never recorded in the CTRF report** — they were only logged. The report's granularity is the test (`CTRFTest`, emitted in `QUnit.testDone`), but screenshots are taken per `QUnit.log` (per assertion), so there was no slot to attach N screenshots to one test.

## Decision

### Agent owns the full filename

The agent constructs the filename for each screenshot directly in the `QUnit.log` handler:

```
filename = `${pageId}-${testId}-${logIndex}.png`
```

`pageId` is per-window (not a CLI option), so it is injected into the agent config via a small per-page script prepended to the script list in `pageTask.ts` before the agent source. The agent reads it via `getConfig().pageId`.

`AgentState.pendingScreenshot` changes from `boolean` to `string | false`:
- `string` — the agent-supplied filename the runner should write
- `false` — no screenshot pending

The runner (`handlePendingScreenshot`) becomes a dumb writer: it reads the filename from state and writes bytes to `reportDir/<filename>`. It contributes no name logic.

### Attachments[] per test

CTRF provides `CTRFTest.attachments[]` for multiple artifacts. The agent accumulates screenshot filenames per test in a `screenshotsByTestId` map (same lifecycle as the existing `logs` map, drained and deleted in `QUnit.testDone`):

```typescript
test.attachments = screenshots.map((name) => ({ name, contentType: 'image/png', path: name }));
```

This keeps the report granularity at the test level while correctly associating N per-assertion screenshots with their test.

### Load-bearing timing assumption

The OPA `waitFor` issued by the agent in `QUnit.log` blocks OPA's serialized assertion queue until `!state.pendingScreenshot`. The runner clears the flag only after attempting the write. OPA serializes a test's assertions/waitFors before `QUnit.testDone` fires, so every pending screenshot for a test is written (and the flag cleared) before `testDone` builds attachments. This guarantees no half-written state leaks into the report on the happy path.

### Write-failure trade-off (accepted)

If a screenshot write fails, the runner logs the error (`logger.error`) and still clears `pendingScreenshot = false`. The agent does not know whether the write succeeded; it always records the attachment path it planned. **The report may reference a filename that does not exist on disk.** This is accepted as an exceptional case — the operator investigates via the logged error and trace file.

Possible future work: a per-name outcome channel (`state.screenshotResults[name] = 'ok' | 'failed'`) would let the agent omit or mark failed attachments.

### Failure screenshot left unchanged

`handleFailureScreenshot` (the `screenshotOnFailure` option) is a separate, pre-existing mechanism: it takes a single screenshot after the run loop ends (to capture final DOM state) and sets `CTRFTest.screenshot` post-hoc. It is intentionally left unchanged — its timing (post-loop) and field (`screenshot` rather than `attachments[]`) are different in nature from per-assertion screenshots.

### Key Components

```
QUnit.log fires (assertion)
       │
       ▼
agent builds filename: ${pageId}-${testId}-${logIndex}.png
       │
       ├─► screenshotsByTestId[testId].push(filename)
       ├─► state.pendingScreenshot = filename
       └─► Opa5.prototype.waitFor({ check: () => !state.pendingScreenshot })
                              (blocks OPA queue until runner clears the flag)

Runner poll loop sees state.pendingScreenshot (string)
       │
       ├─► page.screenshot(reportDir/<filename>)
       └─► state.pendingScreenshot = false     (clears flag, unblocks OPA)

QUnit.testDone fires (after all assertions and waitFors complete)
       │
       └─► test.attachments = screenshotsByTestId[testId].map(...)
           (all writes guaranteed complete by this point)
```

## Consequences

### Positive
- ✅ **Boundary compliance**: filename decisions live in the agent, which owns the browser-side state needed to make them
- ✅ **No runner name logic**: the runner writes bytes to a path it received — nothing more
- ✅ **Report completeness**: per-assertion screenshots are recorded in `CTRFTest.attachments[]` and associated with the correct test
- ✅ **Collision safety**: `pageId` in the filename prevents collisions across parallel pages without the agent needing to know about parallelism
- ✅ **CTRF spec alignment**: `attachments[]` is the standard CTRF slot for multiple artifacts per test

### Negative/Trade-offs
- ❌ **Write-failure opacity**: if a screenshot write fails, the report references a missing file; the only signal is `logger.error` in the runner
- ❌ **Timing coupling**: correctness depends on the OPA `waitFor` serialization guarantee; non-OPA QUnit tests (`state.isOpa === false`) never set `pendingScreenshot`, so per-assertion screenshots only apply to OPA tests
- ❌ **pageId in agent config**: `pageId` is a runtime per-window value, not a CLI option, but it is injected alongside user options in `window['ui5-test-runner'].config`

### Mitigation
- Write failures are logged at `error` level with full context; the trace file provides more detail
- Non-OPA behavior is unchanged — the `state.isOpa` guard preserves existing semantics
- The `getPageIdScript` helper is clearly separate from the options-based `initBrowserConfig`; its role is documented in this ADR

## Related Files & Modules
- **Agent state type**: `src/types/AgentState.ts` — `pendingScreenshot: string | false`
- **Agent config type**: `src/agent/Configuration.ts` — `pageId: number`
- **Agent QUnit hooks**: `src/agent/qunit.ts` — filename construction, `screenshotsByTestId`, `testDone` attachments
- **pageId injection**: `src/modes/test/browserConfig.ts` — `getPageIdScript(pageId)`, `initBrowserConfig`
- **Page orchestration**: `src/modes/test/pageTask.ts` — prepends `pageIdScript` to the scripts list
- **Runner screenshot handlers**: `src/modes/test/screenshot.ts` — `handlePendingScreenshot` (dumb writer), `handleFailureScreenshot` (unchanged)
- **Specs**: `src/agent/qunit.spec.ts`, `src/modes/test/screenshot.spec.ts`, `src/modes/test/browserConfig.spec.ts`
