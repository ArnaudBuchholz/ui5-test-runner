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
- `isMainThread` is not displayed anywhere in the UI.
- No pagination: all logs returned by the query are rendered as-is.
- The log details popup can be dismissed by a close button or by clicking outside it.

## Target browsers

Only modern browsers will be used, ignore Internet Explorer compatibility.

## Wireframes

### Overview

```
+-----------------------------------------------------------------------------------------------------+
| UI5 Test Runner Log Viewer                                                         [Status: Live]   |
+-----------------------------------------------------------------------------------------------------+
| Filter : [ level === "info" && source === "job"                                                  ]  |
|                                                                                                     |
| [Relative v] [Last 15 minutes v] Auto Refresh : [None v] [Refresh now]                              |
|                                                                                                     |
| Error: Invalid filter near token ")"                                                                |
+-----------------------------------------------------------------------------------------------------+
| timestamp (local)   |    | source   | processId | threadId   | message                              |
+---------------------+----+----------+-----------+------------+--------------------------------------+
| 14:07:00.123        | 💬 | job      | 16616     | 0          | Creating folder: ...                 |
| 14:07:00.987        | ⚠️ | qunit    | 16616     | 0          | Test took longer than ...            |
| 14:07:01.111        | ❌ | browser  | 16616     | 3          | Failed to load resource ...          |
| ...                 | ...| ...      | ...       | ...        | ...                                  |
+---------------------+----+----------+-----------+------------+--------------------------------------+
```

### Header detail

* if `state.metrics.reading === true` show :

```
+-----------------------------------------------------------------------------------------------------+
| UI5 Test Runner Log Viewer                                                         [Status: Live]   |
+-----------------------------------------------------------------------------------------------------+
```

* Otherwise, show :

```
+-----------------------------------------------------------------------------------------------------+
| UI5 Test Runner Log Viewer                                                         [Status: Replay] |
+-----------------------------------------------------------------------------------------------------+
```

Clicking on the status button should show a popup indicating state.metrics details.

### Time range (relative)

* When auto refresh is not enabled

```
| [Relative v] [Last 15 minutes v] Auto Refresh : [None v] [Refresh now]                              |
```

* When auto refresh is enabled

```
| [Relative v] [Last 15 minutes v] Auto Refresh : [10s  v] [Refresh now]                              |
```

The auto-refresh dropdown lists the options from `settings.autorefresh` plus a leading **None** entry. Selecting **None** sets `autorefresh: false`; selecting any other entry sets `autorefresh: true` and `autorefreshInterval` to the chosen key.

### Time range (absolute)

```
| [Absolute v] [From: yyyy-mm-dd hh:mm:ss] [To: yyyy-mm-dd hh:mm:ss] [Refresh now]                    |
```

### Level mapping

`level` in `InternalLogAttributes` is a numeric value (`0`–`4`). For display and filter expressions, map it to the following strings:

* `0` / `"debug"` = 🔍
* `1` / `"info"` = 💬
* `2` / `"warn"` = ⚠️
* `3` / `"error"` = ❌
* `4` / `"fatal"` = 💣

In filter expressions the `level` field is exposed as its string equivalent (e.g. `level === "info"`), not as a number.

### Log details

* When clicking a log, show the following popup :

```
+-----------------------------------------------------------------------------------------------------+
| timestamp: 2026-03-26 14:07:00.123 (local)                                                          |
| level: 💬 info [➕][➖]                                                                            |
| source: job [➕][➖]                                                                               |
| processId: 16616 [➕][➖]                                                                          |
| threadId: 0 [➕][➖]                                                                               |
| message: Creating folder: /Users/.../tmp                                                            |
| error (JSON):                               <- shown only when the log has an error field           |
| {                                                                                                   |
|   "name": "Error",                                                                                  |
|   "message": "something went wrong",                                                                |
|   "stack": "Error: something went wrong\n    at ..."                                               |
| }                                                                                                   |
| data (JSON):                                <- shown only when the log has a data field             |
| {                                                                                                   |
|   "testName": "should open app", [➕][➖]                                                          |
|   "durationMs": 241, [➕][➖]                                                                      |
|   "meta": {                                                                                         |
      "browser": "chromium", [➕][➖]                                                                |
      "retry": 0 [➕][➖]                                                                            |
    }                                                                                                 |
| }                                                                                                   |
+-----------------------------------------------------------------------------------------------------+
```

The `error` field (when present) is displayed as read-only formatted JSON — no [➕][➖] buttons, since its nested structure (name, message, stack, cause, errors) doesn't map cleanly to filter expressions.

* Clicking [➕] combines the current filter with AND <field> === <value>

* Clicking [-] combines the current filter with AND <field> !== <value>

* For fields under data, compose the field path using `.` as separators. For instance : `data.testName`

