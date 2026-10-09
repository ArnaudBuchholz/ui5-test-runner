---
"#type": concept
title: Report format
summary: The normalized CTRF-based JSON test report produced by a run, and how results map to it
keywords:
  - report
  - ctrf
  - json
  - results
  - test report
  - format
relations:
  see-also:
    - options/reportDir
    - options/end
    - options/coverageReporters
    - options/screenshotOnFailure
---

# Report

## Common Test Report Format

Version 6 introduced a normalized and documented test report format : [CTRF](https://ctrf.io/) An Open Standard for JSON Test Reports.

The exact shape of the report is defined by the CTRF specification and mirrored in the project's own TypeScript type:

* [CTRF specification](https://github.com/ctrf-io/ctrf/blob/main/spec/ctrf.md)
* [CTRF JSON schema](https://github.com/ctrf-io/ctrf/blob/main/schema/ctrf.schema.json)
* [`CommonTestReportFormat.ts`](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/src/types/CommonTestReportFormat.ts) — the project's TypeScript definition (always the latest version on `main`)

The report is written to `report.json` inside the folder configured by [`--report-dir`](./options/reportDir.md). It is produced once, at the very end of the run, after every page has completed. The file is pretty-printed JSON; an HTML report is generated alongside it in the same folder.

## Mapping

The report is assembled in two places:

* **In the browser**, an *agent* is injected in each test page. As the test framework runs, the agent builds a per-page results object exposed as `window['ui5-test-runner'].results`.
* **On the runner (Node) side**, once a page is done, the runner reads that object back out and merges it into a single aggregate report.

### Document shape

The top-level document is created when the run starts and carries the metadata of the run:

| Field | Value |
|---|---|
| `reportFormat` | `"CTRF"` |
| `specVersion` | `"pre-1.0"` |
| `reportId` | a random UUID generated for this run |
| `timestamp` | run start time (ISO 8601) |
| `generatedBy` | `ui5-test-runner@<version>` |
| `extra.configuration` | the (anonymized) run configuration |

The `results` object holds everything about the execution:

| Field | Value |
|---|---|
| `results.tool.name` / `results.tool.version` | the runner's name and version |
| `results.tool.extra.qunitVersion` | the QUnit version reported by the first page that runs |
| `results.environment` | OS platform / release / version and, under `extra`, the machine, CPU count, and the browser name and version |
| `results.summary` | aggregated counts and timing (see below) |
| `results.tests` | the list of test entries (see below) |

### Summary

`results.summary` is the roll-up across all pages. Each page contributes its own counts, which are summed into the aggregate:

| Field | Meaning |
|---|---|
| `tests` | total number of test entries |
| `passed` / `failed` / `skipped` / `pending` / `other` | counts per status |
| `start` / `stop` | run start and end (milliseconds since epoch); `start` is stamped when the report builder is created, `stop` when the run is finalized |
| `duration` | `stop - start`, in milliseconds |

### Test entries

Each test case becomes an entry in `results.tests`. The core fields come from the test framework (QUnit) when a test finishes:

| Field | Source |
|---|---|
| `id` | the framework test id |
| `name` | the test name |
| `suite` | the module/suite hierarchy, prefixed on the runner side with the suite URL(s) and the page URL so every entry is traceable to the page it came from |
| `duration` | the test runtime, in milliseconds |
| `status` | the normalized outcome (see status mapping) |
| `extra.pageId` | the id of the page that produced the entry |

On failure, additional fields are filled from the first failed assertion:

| Field | Source |
|---|---|
| `message` | the failed assertion message |
| `trace` | the assertion's source / stack |
| `extra.actual` / `extra.expected` | the compared values |
| `extra.QUnitLogs` | all assertion logs captured for the test |

### Status mapping

The test framework's outcome is normalized to one of the five CTRF statuses:

| QUnit outcome | CTRF `status` |
|---|---|
| at least one failed assertion | `failed` |
| skipped | `skipped` |
| `todo` | `pending` |
| otherwise | `passed` |
| synthetic entries (see below) | `other` |

### Screenshots and attachments

Screenshots are attached to test entries via `attachments`, each `{ name, contentType: "image/png", path }`, where `path` is the file name relative to the report folder:

* **OPA screenshots** taken during a test are attached to that test entry.
* **Failure screenshots** — when [`--screenshot-on-failure`](./options/screenshotOnFailure.md) is enabled and a page has at least one failed test, a `<pageId>-failure.png` is captured and added as a synthetic entry named `failure screenshot` with status `other`.

### Error entries

When a page cannot be tested — fetch failure, page or global timeout, or an uncaught error — the runner synthesizes a single `failed` entry named after the page URL, with a `message` pointing to the logs, so the failure is still reflected in the report rather than silently lost.