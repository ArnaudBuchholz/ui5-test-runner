# HTML log viewer

## Overview

`ui5-test-runner` generates log files. A log is a record described by the type `InternalLogAttributes` defined in `src/platform/logger/types.ts`. There is already a built-in server capable of delivering these logs through a REST API documented below. To help users visualize these logs, we need an HTML application.

## Technical overview

Read and follow the documented [Coding Guidelines](./Coding%20Guidelines.md).

## REST API

GET `/query`

Query params:
- from (number, optional): an EPOCH timestamp to filter out logs occurring *before* this value
- to (number, optional): an EPOCH timestamp to filter out logs occurring *after* this value
- skip (number, optional): paging setting, skip a given number of logs
- limit (number, optional, default = 1000): paging setting, fetch only the number of logs
- filter (string, optional): JavaScript expression to filter logs based on log item members.

Response 200 (application/json):
```json
[
  {"level":0,"timestamp":1774457523670,"processId":16616,"threadId":0,"isMainThread":true,"source":"job","message":"Creating folder: /Users/arnaud/git/ui5-test-runner/tmp"}
]
```

Behavior:

- logs are always sorted ascending by timestamp
- endpoint is read-only
- paging is implemented but no total count is returned: when the result contains 1000 logs, use another call to get the following logs (if needed).
- the response header contains statistics about the log file:
  * `x-metrics-chunks-count`: the number of chunks being read
  * `x-metrics-input-size`: input size of the compressed log file
  * `x-metrics-output-size`: output size of the decompressed log file
  * `x-metrics-logs-count`: total number of logs

About filters:

- Almost any JavaScript expression is supported (some operators like the coalesce and the assignment ones missing)
- The `level` member is converted to string to make it more readable, based on the `LogLevel` type described in `src/platform/logger/types.ts`
- The `data` member may contain anything, yet when a filter is created with a non-existing member, it does not fail the expression. For instance, `data.unknown.not_a_member === undefined` returns `true` and does not fail if `data` or `unknown` do not exist.
- Examples:
  - `processId === 16616`
  - `level === "info" && source === "job" && (message.includes("page") || message.includes("test"))`

### Implementation structure

The code for this viewer resides in `src/ui/log`. It must use:

* TypeScript
* Vanilla JavaScript (no framework)
* [UI5 Web Components](https://ui5.github.io/webcomponents/), use only `@ui5/webcomponents`.
* `vite` for bundling
* `vitest` for testing

Do not put everything in the `main.ts` file, split the implementation into manageable chunks which are unit tested.
Only the logic should be tested.

The build output should go in `dist/ui5-test-runner-log-viewer.js` as a single self-contained and minified JavaScript file (it must pack everything, including CSS).

### Clarified requirements

- The viewer will be served by the same server that exposes the REST endpoint. Defining the exact page route is out of scope for this document.
- Default timeline at page load: last 15 minutes.
- Timestamps are displayed in local timezone.
- Auto refresh is disabled by default and can be enabled manually.
- Supported auto refresh intervals: 5s, 10s, 30s, 60s.
- Cell-based filter helpers append conditions using `AND` by default.
- If a filter expression is invalid, keep the previous results visible and show an inline error.
- The `data` field is hidden by default in the table and visible in a log details panel.
- For this first version, each refresh loads up to the API default page size (1000 logs).
- Log ordering remains ascending by timestamp (no sort toggle in UI).
- MVP includes text search.
- Do not include export or column toggles in v1.

### Target browsers

Only modern browsers will be used, ignore Internet Explorer compatibility.

## Expected features

Globally, I want a tool that is as helpful as Kibana can be when exploring traces.
The most important expected features are:
- Possibility to select timeline (either absolute or relative like the last 15 minutes)
- Manual refresh or automatic refresh
- Helpers to build trace filters (for example, clicking a cell and having the option to exclude the value or show only logs with this value)

As a first step, paging is not required.

### Wireframes

````
+-----------------------------------------------------------------------------------------------------+
| UI5 Test Runner Log Viewer                                                         [Status: Live]   |
+-----------------------------------------------------------------------------------------------------+
| Time Range                                                                                          |
| [Relative v] [Last 15 minutes v]   OR   [Absolute v] [From: yyyy-mm-dd hh:mm:ss] [To: ...]          |
|                                                                                                     |
| Refresh                                                                                             |
| [Refresh Now]   [ ] Auto refresh   [Interval: 10s v]   Last refresh: 14:22:10                       |
|                                                                                                     |
| Filter + Search                                                                                     |
| Filter expression: [ level === "info" && source === "job"                              ][Apply]     |
| Search text:       [ page timeout                                                              ]    |
| Inline error: Invalid filter near token ")"                                                         |
|                                                                                                     |
| Quick helpers (from selected cell):                                                                 |
| [Include this value] [Exclude this value] [Append with AND]                                         |
+-----------------------------------------------------------------------------------------------------+
| Results (max 1000 per refresh, ascending timestamp)                                      423 rows   |
+----+---------------------+--------+----------+-----------+------------+-----------------------------+
| #  | timestamp (local)   | level  | source   | processId | threadId   | message                     |
+----+---------------------+--------+----------+-----------+------------+-----------------------------+
| 1  | 14:07:00.123        | info   | job      | 16616     | 0          | Creating folder: ...        |
| 2  | 14:07:00.987        | warn   | qunit    | 16616     | 0          | Test took longer than ...   |
| 3  | 14:07:01.111        | error  | browser  | 16616     | 3          | Failed to load resource ... |
| .. | ...                 | ...    | ...      | ...       | ...        | ...                         |
+----+---------------------+--------+----------+-----------+------------+-----------------------------+
| Row actions/context menu on cell click:                                                             |
| - Add filter: source === "job"                                                                      |
| - Add filter: source !== "job"                                                                      |
| - Add filter: message.includes("folder")                                                            |
+-----------------------------------------------------------------------------------------------------+
| Log Details (selected row)                                                                          |
| timestamp: 2026-03-26 14:07:00.123 (local)                                                          |
| level: info    source: job    processId: 16616    threadId: 0    isMainThread: true                 |
| message: Creating folder: /Users/.../tmp                                                            |
| data (JSON):                                                                                        |
| {                                                                                                   |
|   "testName": "should open app",                                                                    |
|   "durationMs": 241,                                                                                |
|   "meta": { "browser": "chromium", "retry": 0 }                                                     |
| }                                                                                                   |
+-----------------------------------------------------------------------------------------------------+
| Metrics from response headers                                                                       |
| chunks: 12   compressed: 1.4MB   decompressed: 8.9MB   total logs in file: 145230                   |
+-----------------------------------------------------------------------------------------------------+
```

