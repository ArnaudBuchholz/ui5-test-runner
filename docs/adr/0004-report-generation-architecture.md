# ADR-0004: Report Generation Architecture

## Status
Accepted

## Context

Test execution and report generation have traditionally been tightly coupled:
- Tests run → immediately formatted into final report
- Adding new report formats requires modifying test execution code
- Real-time result viewing is difficult without a unified data model
- Report generation is a performance bottleneck during test execution

The `ui5-test-runner` needs to support multiple outputs simultaneously:
1. **HTML reports** for manual inspection
2. **JSON exports** for tooling integration (e.g. CTRF-compatible consumers)
3. **Log viewer UI** showing recorded log data after or during execution

Tightly coupling test execution to each format creates duplication and maintenance burden.

## Decision

Implement a **Decoupled Report Generation Pipeline**:

```
┌─────────────────────────────────────────────────────────┐
│ Test Execution (Browsers + Agent)                       │
│ - Tests run in parallel (pageTask)                      │
│ - Agent collects raw results in browser window          │
│ - CLI polls window['ui5-test-runner'].results           │
└─────────────┬───────────────────────────────────────────┘
              │
              │ CommonTestReport['results'] per page
              ▼
┌─────────────────────────────────────────────────────────┐
│ TestReportBuilder (src/utils/shared/TestReportBuilder)  │
│ - Merges per-page results into a single CommonTestReport│
│ - Resolves suite hierarchy (nested suite URLs)          │
│ - Stores environment info (OS, browser, configuration)  │
└─────────────┬───────────────────────────────────────────┘
              │
              │ Full CommonTestReport (CTRF)
              ▼
┌─────────────────────────────────────────────────────────┐
│ saveReport (src/reports/saveReport.ts)                  │
│ - Writes report.json (raw CTRF JSON)                    │
│ - Generates report.html (self-contained HTML viewer)    │
└─────────────────────────────────────────────────────────┘
```


### Key Components

**Common Test Report Format (CTRF) - `src/types/CommonTestReportFormat.ts`**
- Single unified data structure (`CommonTestReport`) for all test results
- Follows the open CTRF specification (https://ctrf.io)
- Independent of execution engine or report format
- Contains:
  - `results.tool` — name and version of the testing tool (QUnit)
  - `results.summary` — aggregate counts (passed, failed, skipped, pending, other) and timing (start/stop/duration)
  - `results.tests` — array of individual test cases with name, status, duration, suite hierarchy, message/trace
  - `results.environment` — OS details, browser name/version, and extra metadata
  - Top-level `reportFormat`, `specVersion`, `reportId`, `timestamp`, `generatedBy`, `extra`

**Agent Instrumentation - `src/agent/`**
- Runs inside the browser page alongside QUnit
- `AgentTestResultsBuilder` (`src/agent/report.ts`) collects raw QUnit results into a `CommonTestReport['results']` object
- Stored on `window['ui5-test-runner'].results`; the CLI polls this via `window.eval` in `pageTask.ts` — there is no push/send mechanism

**TestReportBuilder - `src/utils/shared/TestReportBuilder.ts`**
- Accumulates per-page `CommonTestReport['results']` into a single full `CommonTestReport`
- Resolves suite nesting (suite URLs discovered via the suite agent type become prefix segments in `test.suite`)
- Finalized at the end of all page tasks with `stop` and `duration`

**Report Output - `src/reports/`**
```
src/reports/
├── html.ts              (HTML report generation — inlines CTRF JSON + Vite-built UI scripts)
├── initReportBuilder.ts (creates and configures the TestReportBuilder for a run)
├── saveReport.ts        (writes report.json and report.html to reportDir)
└── ui/                  (ReportController for the static HTML report viewer UI)
```

There is **no** JUnit XML generator, no dedicated JSON-export generator, no console-output generator,
and no pipeline/`IReportGenerator` abstraction. `saveReport` calls `html.ts` directly.

**HTML Report - `src/reports/html.ts` + `src/ui/report/`**
- Generates a self-contained `report.html` by inlining the CTRF JSON and Vite-built scripts
- The Vite frontend (`src/ui/report/`) renders the report using `ReportController` (`src/reports/ui/`)
- No WebSocket or live-update mechanism — the HTML report is static

**Log Viewer UI - `src/ui/log/` + `src/modes/log/`**
- Separate mode (`--log <file>`) that reads a compressed `.logz` log file
- Serves a REserve HTTP server and opens a browser window with the log viewer
- This is NOT a real-time test-execution progress UI; it post-processes recorded logs

**Batch Mode - `src/modes/batch/`**
- Builds a `CommonTestReport` from batch item outcomes (`buildBatchReport`)
- Calls the same `saveReport` to produce `report.json` and `report.html`

## Consequences

### Positive
- ✅ **Decoupling**: Test execution doesn't know about report formats
- ✅ **Extensibility**: Adding a new output format only requires a new module (no touching test code)
- ✅ **Reusability**: CTRF JSON can be consumed by external tools without reverse-engineering
- ✅ **Efficiency**: Single format transformation vs. N format-specific transformations
- ✅ **CI/CD Integration**: CTRF JSON is machine-readable; compatible with ctrf.io ecosystem

### Negative/Trade-offs
- ❌ **No real-time UI**: There is no WebSocket-based live progress view during test execution
- ❌ **Schema Management**: CTRF schema needs versioning as it evolves (currently `specVersion: "pre-1.0"`)
- ❌ **Overhead**: Extra transformation step from execution results → CTRF

### Mitigation
- Document CTRF schema with examples
- Provide CTRF validators to catch schema violations early
- Version CTRF schema explicitly (`SPEC_VERSION` constant in `CommonTestReportFormat.ts`)

## Related Files & Modules
- **Data Model**: `src/types/CommonTestReportFormat.ts` — exports `CommonTestReport`, `CTRFTest`, `CommonTestStatus`
- **Agent Collection**: `src/agent/report.ts` — `AgentTestResultsBuilder` fills `CommonTestReport['results']` inside the browser
- **CLI Polling**: `src/modes/test/pageTask.ts` — reads agent results via `window.eval`, merges into `TestReportBuilder`
- **Report Builder**: `src/utils/shared/TestReportBuilder.ts` — accumulates and finalizes `CommonTestReport`
- **Builder Init**: `src/reports/initReportBuilder.ts` — creates `TestReportBuilder` with tool/environment metadata
- **Save**: `src/reports/saveReport.ts` — writes `report.json` and `report.html`
- **HTML Gen**: `src/reports/html.ts` — inlines CTRF JSON into self-contained HTML
- **Report UI Controller**: `src/reports/ui/ReportController.ts` — drives the static report viewer
- **Vite Frontend**: `src/ui/report/` — UI5-free Vite app for report rendering
- **Log Viewer**: `src/ui/log/` + `src/modes/log/` — separate post-execution log viewing mode
- **CLI Entry**: `src/cli.ts` → `src/modes/execute.ts` → `test()` / `batch()` → `saveReport()`

## Common Test Report Format (CTRF) Structure

See [CommonTestReport TypeScript type definition](../../src/types/CommonTestReportFormat.spec.ts)

