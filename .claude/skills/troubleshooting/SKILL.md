---
name: troubleshooting
description: Troubleshoot a ui5-test-runner execution. Reads report.json (CTRF format) from the report folder, summarises the run status, and when needed extracts traces from the latest traces-YYYYMMDD-HHMMSS.logz file via `npm run cli -- --log <file> --log-dump`.
allowed-tools:
  - Read
  - Bash(find * -name "report.json")
  - "Bash(find * -name 'traces-*.logz')"
  - "Bash(npm run cli -- --log * --log-dump)"
---

# Troubleshooting a ui5-test-runner execution

## Step 1 — Locate the report folder

If the user has not supplied a path, ask:

> "Where is the report folder? (default: `report`)"

Accept a relative or absolute path. All subsequent steps operate inside that folder.

## Step 2 — Read `report.json`

Read `<reportDir>/report.json`. It follows the **Common Test Report Format (CTRF)** — see `src/types/CommonTestReportFormat.ts` for the full type.

Extract and present the following summary:

| Field | Where in CTRF |
|---|---|
| Total tests | `results.summary.tests` |
| Passed | `results.summary.passed` |
| Failed | `results.summary.failed` |
| Skipped | `results.summary.skipped` |
| Pending | `results.summary.pending` |
| Other | `results.summary.other` |
| Duration | `results.summary.duration` ms (or derive from `stop - start`) |
| Start / Stop | `results.summary.start` / `results.summary.stop` (Unix epoch ms → human-readable) |

Then evaluate overall health:

- **All passed** → report success, no further action needed.
- **Any failed** → list the failing tests (fields: `name`, `suite`, `message`, `trace`). Ask the user whether they want to dig into the traces.
- **Zero tests / missing summary** → warn that the report may be incomplete; suggest checking traces regardless.

## Step 3 — Retrieve traces (when needed)

Only proceed to this step if the user confirms they want trace details, or if the report is empty/incomplete.

### 3a — Find the latest trace file

Run:

```bash
find <reportDir> -name 'traces-*.logz' | sort | tail -1
```

The filename pattern is `traces-YYYYMMDD-HHMMSS.logz`. The lexicographic sort gives the most recent file last.

If no file is found, tell the user there are no trace files in the report folder and stop.

### 3b — Dump the traces

Run:

```bash
npm run cli -- --log <path-to-logz-file> --log-dump
```

This streams the decompressed trace entries to stdout.

### 3c — Interpret the output

Each line of the dump is a JSON object matching `InternalLogAttributes` from `src/platform/logger/types.ts`. Key fields:

| Field | Type | Meaning |
|---|---|---|
| `timestamp` | number | Unix epoch ms — convert to human-readable time |
| `level` | 0–4 | `0`=debug, `1`=info, `2`=warn, `3`=error, `4`=fatal |
| `source` | string | Origin: `browser`, `browser/agent`, `browser/console`, `browser/network`, `page`, `job`, `server`, `thread`, `process`, `npm`, `playwright`, `puppeteer`, `exit`, `http`, `metric`, `progress`, `assert`, `reserve`, … |
| `message` | string | Human-readable log message |
| `error` | unknown | Present on errors/assertions — show prominently |
| `processId` | number | Worker process index |
| `threadId` | number | Worker thread index |
| `pageId` | number | Which test page (for page-scoped sources) |
| `data` | object | Source-specific payload (see below) |

**Source-specific `data` shapes:**

- `source: 'http'` → `{ requestId, init?, status?, headers? }` — HTTP request lifecycle
- `source: 'metric'` → `{ cpu, mem, elu }` — resource metrics
- `source: 'progress'` (no pageId) → `{ value, max }` — overall pages progress
- `source: 'progress'` (with pageId) → `{ value, max, errors, type, remove? }` — per-page test progress
- `source: 'reserve'` → `message` is the `ServerEventName`; `data` is the server event payload

**Reading strategy:**

1. Filter to `level >= 2` (warn/error/fatal) first for a quick overview of failures.
2. For each failing test page, filter by its `pageId` to reconstruct what happened.
3. Look for `source: 'browser/agent'` entries — these carry QUnit/OPA test lifecycle events.
4. `source: 'assert'` entries always have an `error` field — surface these explicitly.
5. `source: 'fatal'` entries (level 4) indicate the runner itself crashed — show message and error.

Present findings grouped by severity, then by page, with timestamps in local time.
