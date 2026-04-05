# HTML log viewer

## Functional Overview

`ui5-test-runner` generates log files. A log is a record described by the type `InternalLogAttributes` defined in `src/platform/logger/types.ts`.
To help users visualize these logs, we need an HTML application.

## Technical overview

* Read and follow the documented [Coding Guidelines](./Coding%20Guidelines.md).
* Follow the [UI Controller Guidelines](./UI%20Controller%20Guidelines.md) by instantiating the [LogViewerController](../../src/modes/log/ui/LogViewerController.ts).
State, Settings and Actions are defined in [Types](../../src/modes/log/ui/types.ts).

## Implementation structure

The code for this viewer resides in `src/ai/log`. It must use:

* TypeScript
* Vanilla JavaScript (no framework)
* [UI5 Web Components](https://ui5.github.io/webcomponents/), use only `@ui5/webcomponents`.
* `vite` for bundling
* `vitest` for testing

Do not put everything in the `main.ts` file, split the implementation into manageable chunks which are unit tested.
Only the logic should be tested.

The build output should go in `dist/ui5-test-runner-log-viewer.js` as a single self-contained and minified JavaScript file (it must pack everything, including CSS).

## Clarified requirements

- Timestamps are displayed in local timezone.
- The `data` field is hidden by default in the table and visible in a popup.
- Log ordering remains ascending by timestamp (no sort toggle in UI).

## Target browsers

Only modern browsers will be used, ignore Internet Explorer compatibility.

## Wireframes

### Overview

```
+-----------------------------------------------------------------------------------------------------+
| UI5 Test Runner Log Viewer                                                         [Status: Live]   |
+-----------------------------------------------------------------------------------------------------+
| Time Range                                                                                          |
| [Relative v] [Last 15 minutes v]   OR   [Absolute v] [From: yyyy-mm-dd hh:mm:ss] [To: ...]          |
|                                                                                                     |
| Refresh                                                                                             |
| [Refresh Now]   [ ] Auto refresh   [Interval: 10s v]   Last refresh: 14:22:10                       |
|                                                                                                     |
| Filter expression: [ level === "info" && source === "job"                              ] [Apply]    |
| Error: Invalid filter near token ")"                                                                |
|                                                                                                     |
| Quick helpers (from selected cell):                                                                 |
| [Include this value] [Exclude this value] [Append with AND]                                         |
+-----------------------------------------------------------------------------------------------------+
| Results (max 1000 per refresh, ascending timestamp)                                      423 rows   |
+---------------------+--------+----------+-----------+------------+----------------------------------+
| timestamp (local)   | level  | source   | processId | threadId   | message                          |
+---------------------+--------+----------+-----------+------------+----------------------------------+
| 14:07:00.123        | info   | job      | 16616     | 0          | Creating folder: ...             |
| 14:07:00.987        | warn   | qunit    | 16616     | 0          | Test took longer than ...        |
| 14:07:01.111        | error  | browser  | 16616     | 3          | Failed to load resource ...      |
| ...                 | ...    | ...      | ...       | ...        | ...                              |
+---------------------+--------+----------+-----------+------------+----------------------------------+
```

### Header detail

if `state.metrics.reading === true` show :

```
+-----------------------------------------------------------------------------------------------------+
| UI5 Test Runner Log Viewer                                                         [Status: Live]   |
+-----------------------------------------------------------------------------------------------------+
```

Otherwise, show :

```
+-----------------------------------------------------------------------------------------------------+
| UI5 Test Runner Log Viewer                                                         [Status: Replay] |
+-----------------------------------------------------------------------------------------------------+
```

Clicking on the status button should show a popup indicating state.metrics details.

### Log details

When clicking a log, show the following popup :

```
+-----------------------------------------------------------------------------------------------------+
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
```
