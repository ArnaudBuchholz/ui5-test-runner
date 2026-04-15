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

## Rendering contract

### Layout and scrolling

The application uses a fixed-height viewport layout:

- The **header** and **toolbar** are fixed at the top and never scroll.
- The **log table** fills the remaining viewport height and scrolls vertically within that region.
- The **page itself does not scroll** — `body` and `#app` must not overflow vertically.

Concretely:
- `body` and `#app`: `height: 100vh; overflow: hidden; display: flex; flex-direction: column`
- The log table wrapper: `flex: 1; overflow-y: auto`

### Popover opener

Pass the clicked element directly as the `opener` — do **not** re-query the DOM by ID inside the click handler. Use `event.currentTarget`:

```typescript
button.addEventListener('click', (event) => {
  popover.opener = event.currentTarget;
  popover.open = true;
});
```

### UI5 Popover placement

`<ui5-popover>` elements must **not** be injected into `#app` via `innerHTML` — placing them as flex siblings of the header or toolbar breaks the layout. Instead, declare them **once, statically, in the HTML shell** (e.g. directly inside `<body>`, before `#app`). Update their inner content via `popover.innerHTML = ...` when state changes. Never re-render or replace the popover element itself.

### UI5 component mapping

Every interactive control must use the specific UI5 Web Component listed below. Plain `<input>`, `<select>`, or `<button>` elements are not acceptable in place of their UI5 equivalents.

| Purpose | Component | Import |
|---------|-----------|--------|
| Filter text field | `<ui5-input>` | `@ui5/webcomponents/dist/Input.js` |
| Relative / absolute toggle | `<ui5-select>` + `<ui5-option>` | `@ui5/webcomponents/dist/Select.js` |
| Relative time-range picker | `<ui5-select>` + `<ui5-option>` | `@ui5/webcomponents/dist/Select.js` |
| Auto-refresh picker | `<ui5-select>` + `<ui5-option>` | `@ui5/webcomponents/dist/Select.js` |
| Absolute date-time (From / To) | `<ui5-datetime-picker>` | `@ui5/webcomponents/dist/DateTimePicker.js` |
| Refresh / action buttons | `<ui5-button>` | `@ui5/webcomponents/dist/Button.js` |
| Error message | `<ui5-message-strip design="Negative">` | `@ui5/webcomponents/dist/MessageStrip.js` |
| Metrics popup | `<ui5-popover>` | `@ui5/webcomponents/dist/Popover.js` |
| Log details close button | `<ui5-button design="Transparent">` | `@ui5/webcomponents/dist/Button.js` |

`<ui5-datetime-picker>` emits a `change` event; read the selected value from `event.detail.value` (a formatted string) or `event.target.dateValue` (a `Date` object). Convert to epoch with `.getTime()`.

## Target browsers

Only modern browsers will be used, ignore Internet Explorer compatibility.

## Wireframes

(made with https://wiretext.app/)

### Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┌──────────────┐
│ UI5 Test Runner Log Viewer                                                                      │ Status: Live │
└─────────────────────────────────────────────────────────────────────────────────────────────────└──────────────┘
│         ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ Filter :│ level !== "debug" && )                                                                             │ │
│         └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────┐ ┌─────────────────────┐                 ┌───────────┐  ┌──────────────┐                   │
│ │ Relative       ▾ │ │ Last 15 minutes   ▾ │  Auto Refresh : │ None    ▾ │  │ Refresh Now  │                   │
│ └──────────────────┘ └─────────────────────┘                 └───────────┘  └──────────────┘                   │
│                                                                                                                │
│ Error : Invalid filter near token ")"                                                                          │
│                                                                                                                │
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬──────────────────────┐
│ timestamp       │ level           │ source          │ process id      │ thread id       │ message              │
│─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────────│
│14:07:00.123     │                 │job              │16616            │ 0               │Creating folder: ...  │
│                 │                 │                 │                 │                 │                      │
│                 │                 │                 │                 │                 │                      │
│                 │                 │                 │                 │                 │                      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴──────────────────────┘
```

The level column should show icons as described in **Level mapping**

### Header detail

* if `state.metrics.reading === true` show :

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┌──────────────┐
│ UI5 Test Runner Log Viewer                                                                      │ Status: Live │
└─────────────────────────────────────────────────────────────────────────────────────────────────└──────────────┘
```

* Otherwise, show :

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┌────────────────┐
│ UI5 Test Runner Log Viewer                                                                    │ Status: Replay │
└───────────────────────────────────────────────────────────────────────────────────────────────└────────────────┘
```

Clicking on the status button should show a popup indicating state.metrics details.

### List header

Clicking one list header should allow the user to filter on the selected column value.

Considering the following logs to be displayed :

| timestamp        | level           | source          | process id      | thread id       | message              |
|------------------|-----------------|-----------------|-----------------|-----------------|----------------------|
| 2026-04-15 11:15 | debug           | job             | 123             | 456             |                      |
| 2026-04-15 11:16 | info            | job             | 123             | 456             |                      |
| 2026-04-15 11:17 | debug           | http            | 123             | 456             |                      |
| 2026-04-15 11:18 | warn            | job             | 780             | 0.              |                      |
| 2026-04-15 11:19 | debug           | job             | 123             | 456             |                      |

* Clicking the timestamp header switches the timerange to absolute and uses the range corresponding to the logs being displayed (i.e. from 2026-04-15 11:15 to  2026-04-15 11:19)

* Clicking the level header always shows the following dialog

```
┌─────────────────────────┐
│ [ ] debug               │
│                         │
│ [ ] info                │
│                         │
│ [ ] warn                │
│                         │
│ [ ] error               │
│                         │
│ [ ] fatal               │
│            ┌──────────┐ │
│            │  Filter  │ │
│            └──────────┘ │
└─────────────────────────┘
```

* clicking the source, processId or threadId column should show a popup that enables the user to pick values he wants to filter one (based only on the logs being displayed), for instance for source :

```
┌─────────────────────────┐
│ [ ] job                 │
│                         │
│ [ ] http                │
│            ┌──────────┐ │
│            │  Filter  │ │
│            └──────────┘ │
└─────────────────────────┘
```

All filter dialogs (level, source, processId, threadId) always appear with no checkbox ticked by default — do not try to deduce from the current filter which values should be ticked. After the user selected values, combine the current filter with `&& (field === value1 || field === value2 ...)`.

Only one popup is displayed at a time. Opening a new popup closes any previously open one. A popup is also closed when it loses focus (i.e. the user clicks outside of it).

### Time range (relative)

* When auto refresh is not enabled

```
│ ┌──────────────────┐ ┌─────────────────────┐                 ┌───────────┐  ┌──────────────┐                   │
│ │ Relative       ▾ │ │ Last 15 minutes   ▾ │  Auto Refresh : │ None    ▾ │  │ Refresh Now  │                   │
│ └──────────────────┘ └─────────────────────┘                 └───────────┘  └──────────────┘                   │
```

* When auto refresh is enabled

```
│ ┌──────────────────┐ ┌─────────────────────┐                 ┌───────────┐  ┌──────────────┐                   │
│ │ Relative       ▾ │ │ Last 15 minutes   ▾ │  Auto Refresh : │ 10s     ▾ │  │ Refresh Now  │                   │
│ └──────────────────┘ └─────────────────────┘                 └───────────┘  └──────────────┘                   │
```

The auto-refresh dropdown lists the options from `settings.autorefresh` plus a leading **None** entry. Selecting **None** sets `autorefresh: false`; selecting any other entry sets `autorefresh: true` and `autorefreshInterval` to the chosen key.

The Auto Refresh label and dropdown are **only shown when `timerangeType === 'relative'`**. They must be absent from the toolbar when absolute time range is selected.

### Time range (absolute)

```
│ ┌──────────────────┐        ┌───────────────────────┐      ┌───────────────────────┐ ┌──────────────┐          │
│ │ Absolute       ▾ │  From :│ yyyy-mm-dd hh:mm:ss ▾ │  To :│ yyyy-mm-dd hh:mm:ss ▾ │ │ Refresh Now  │          │
│ └──────────────────┘        └───────────────────────┘      └───────────────────────┘ └──────────────┘          │
```

The from and to fields are datetime pickers.

### Level mapping

`level` in `InternalLogAttributes` is a numeric value (`0`–`4`). For display and filter expressions, map it to the following strings:

|level|string|icon|HTML entity to use|
|---|---|---|---|
|0|`"debug"`|🔍|&#128269;|
|1|`"info"`|💬|&#128172;|
|2|`"warn"`|⚠️|&#9888;&#65039;|
|3|`"error"`|❌|&#10060;|
|4|`"fatal"`|💣|&#128163;|

In filter expressions the `level` field is exposed as its string equivalent (e.g. `level === "info"`), not as a number.

### Log details

* When clicking a log, show the following popup :

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ timestamp: 2026-03-26 14:07:00.123 (local)                                                │
│ level: info [+][-]                                                                        │
│ source: job [+][-]                                                                        │
│ processId: 16616 [+][-]                                                                   │
│ threadId: 0 [+][-]                                                                        │
│ message: Creating folder: /Users/.../tmp                                                  │
│ error (JSON):                               <- shown only when the log has an error field │
│ {                                                                                         │
│   "name": "Error",                                                                        │
│   "message": "something went wrong",                                                      │
│   "stack": "Error: something went wrong\n    at ..."                                      │
│ }                                                                                         │
│ data (JSON):                                <- shown only when the log has a data field   │
│ {                                                                                         │
│   "testName": "should open app", [+][-]                                                   │
│   "durationMs": 241, [+][-]                                                               │
│   "meta": {                                                                               │
│     "browser": "chromium", [+][-]                                                         │
│     "retry": 0 [+][-]                                                                     │
│   }                                                                                       │
│ }                                                                                         │
└───────────────────────────────────────────────────────────────────────────────────────────┘

```

The `error` field (when present) is displayed as read-only formatted JSON — no [+][-] buttons, since its nested structure (name, message, stack, cause, errors) doesn't map cleanly to filter expressions.

* Clicking [+] (use entity `&#10133;`) combines the current filter with AND <field> === <value>

* Clicking [-] (use HTML entity `&#10134;`) combines the current filter with AND <field> !== <value>

* `[+][-]` buttons appear on both scalar values and nested objects — any value that can be meaningfully compared in a filter expression.

* For fields under data, compose the field path using `.` as separators. For instance: `data.testName`. For array elements, include the index: `data.items[0]`.

