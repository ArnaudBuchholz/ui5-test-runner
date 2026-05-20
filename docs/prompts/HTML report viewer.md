# HTML report viewer

## Functional Overview

`ui5-test-runner` executes tests and produces a CTRF (Common Test Report Format) as documented in https://ctrf.io/.
To make this report more accessible, this JSON report must be converted to a nice HTML interface that allows the user to navigate the results.

## Technical overview

Follow the [UI Controller Guidelines](./UI%20Controller%20Guidelines.md) with:
- **controller_source** = `src/reports/ui/ReportController.ts`
- **types_source** = `src/reports/ui/types.ts`
- **output_path** = `src/ai/report`
- **dist_name** = `dist/ui5-test-runner-html-report.js`

The `test.html` entry point does not embed sample data — the initial UI is driven by `controller.state.mode` (starts in `'open'` mode, prompting the user to pick a file).

### CTRF Format

The project provides an up to date description of the format in `src/types/CommonTestReportFormat.ts`.

About the CTRF report content, the following properties are always set :

  * `results.summary` structure (including `duration`)
  * `results.tests[].name`, `results.tests[].status`, `results.tests[].duration`

### Understanding suite

`results.tests[].suite` is an optional `readonly [string, ...string[]]` — an array of strings representing the hierarchy from the top-level container down to the immediate parent of the test.

Example: `['Module A', 'Component B']` means the test is nested as **Module A → Component B → test name**.

The controller builds a `Suite` tree from the filtered test list and exposes it as `state.suites`. Each node has:
- `uid` — cumulative path elements joined with `'\r'`
- `label` — display text (URL-like entries are automatically shortened)
- `suites` — nested child suites

For `['Module A', 'Component B']` the UIDs are:
- "Module A" → `uid = 'Module A'`
- "Component B" → `uid = 'Module A\rComponent B'`

**Breadcrumbs**: each element of a test's `suite` array is rendered as a clickable label. Clicking sends `controller.interaction({ filterOnSuiteUid: uid })` where `uid` is the cumulative path up to and including that element (`suite.slice(0, i+1).join('\r')`). If `suite` is absent, no breadcrumbs are shown.

**Suite filter**: rendered as a button showing the currently selected suite label (or "All suites" when `state.filterOnSuiteUid` is empty). Clicking it opens a `<ui5-popover>` that lists the full `state.suites` tree. Each entry is clickable: selecting it sends `controller.interaction({ filterOnSuiteUid: suite.uid })` and closes the popover. The entry matching `state.filterOnSuiteUid` is highlighted. All tree levels are always visible (no collapse within the popover).

Suite popover wireframe:

```
┌─────────────────────────────────────┐
│ Suite filter                   [X]  │
├─────────────────────────────────────┤
│  (All suites)                       │  <- filterOnSuiteUid: ''
│  Module A                           │  <- filterOnSuiteUid: 'Module A'
│    Component B                      │  <- filterOnSuiteUid: 'Module A\rComponent B'
│      Sub Component C                │  <- filterOnSuiteUid: 'Module A\rComponent B\rSub Component C'
│  Module D                           │  <- filterOnSuiteUid: 'Module D'
└─────────────────────────────────────┘
```

Each indentation level corresponds to one depth in the `suites` tree.

**Hash storage**: the selected suite UID is stored URL-encoded in the `suite=` hash parameter.

### Duration formatting

A single formatting helper is used for all durations (test `duration`, summary total). Input is always milliseconds:

| Range | Format | Example |
|---|---|---|
| < 1 000 ms | `{N}ms` | `42ms` |
| 1 000 ms – 59 999 ms | `{N}s` (rounded to nearest second) | `12s` |
| ≥ 60 000 ms | `{M}m {S}s` | `1m 0s` |

## Expected features

### General UX

The UI should be split into 3 parts :

1. A summary part that indicates :
  * Report information (date of execution, id and tool being used). If some of these information are missing, display N/A in place of the value.
  * An overall status: **failed** if `summary.failed > 0`, **success** otherwise.
  * Total number of tests, number of passed, failed and skipped (ignore other statuses)
  * If any other status is contained in the CTRF report, regroup them in a value called "other" (do not show this value otherwise). "Other" is computed as `summary.pending + summary.other`.
  * This section can be collapsed to give more screen space for the test list. It must be collapsed by default.
2. A filtering part
3. The list of test results (after filters were applied), showing :
  * Number of tests being displayed 
  * Number of passed, failed and detail of other statuses
  * For each test to display
    * The suite hierarchy as clickable breadcrumbs (clicking one item should change the suite filter accordingly)
    * The test name
    * The status
    * Upon clicking the test, additional details might be displayed using a collapsible part that is collapsed by default. The collapsible section is a plain `<div>` toggled by the `[>]/[V]` button — not a `<ui5-panel>`.
      * `duration`
      * `message` (if set) rendered as plain text
      * `trace` (if set) rendered as a call stack using monospace font
  * Rows use the array index as their stable `data-key`.

The page title should be "UI5 Test Runner Report".

### Wireframes

#### Components

* Simple syntaxes

|Wireframe Syntax|UI5 equivalent|
|---|---|
|`((+ 1 passed))`|`<ui5-tag design="Positive">1 passed</ui5-tag>`|
|`((- 1 failed))`|`<ui5-tag design="Negative">1 failed</ui5-tag>`|
|`((1 skipped))`|`<ui5-tag design="Neutral">1 skipped</ui5-tag>`|
|`((1 other))`|`<ui5-tag design="None">1 other</ui5-tag>`|

#### General page structure

```
┌───────────────────────────────────────────────────────────────────────┐
│ [V] Summary              [Open Report]  [Export]         ((- failed)) │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ "Date"             "Report ID"     "Tool"                "Duration"   │
│ 1/1/2026 5:40      0123            ui5-test-runner@6     1m 0s        │ <- Tool displays report.generatedBy; Date displays report.timestamp formatted with browser locale (N/A if absent); Report ID displays full value of reportId
│                                                                       │
│ "Tests (Qunit@1.2.3)"                                                 | <- QUnit@1.2.3 is report.results.tool.name + @ + report.results.tool.version; if version is absent, omit the @version part
│ 3 total ((+ 1 passed)) ((- 1 failed)) ((1 skipped))                   │
└───────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────┐
| "Suite"            "Status"           "Search"                        │
| [All suites    V]  [drop down  V]     [___________]                   │ <- Suite looks like a drop down but it opens the suite popover
└───────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────┐
│ Tests (3)                 ((+ 1 passed)) ((- 1 failed)) ((1 skipped)) │
├───────────────────────────────────────────────────────────────────────┤
| Sort By : [Execution Order] [Name] [Duration]                         |
├───────────────────────────────────────────────────────────────────────┤
(repeat for each test)

  (when collapsed)
├───────────────────────────────────────────────────────────────────────┤
| [>] [suite breadcrumb] Test name                             (status) |
├───────────────────────────────────────────────────────────────────────┤

  (when expanded)
├───────────────────────────────────────────────────────────────────────┤
| [V] [suite breadcrumb] Test name                             (status) |
├───────────────────────────────────────────────────────────────────────┤
| Duration     100ms                                                    │
| Message      Expected true to be false                                │
| Stack        at test.js:42                                            │
├───────────────────────────────────────────────────────────────────────┤

(end of page)
└───────────────────────────────────────────────────────────────────────┘

```

### Filtering controls

The filter bar contains three controls bound to controller state:

| Control | Controller field | Options source |
|---|---|---|
| Suite button + popover | `state.filterOnSuiteUid` | `state.suites` tree (see **Understanding suite**) |
| Status dropdown | `state.filterOnStatus` | `settings.filterOnStatus` |
| Search text field | `state.search` | — |

The Status dropdown is populated from `settings.filterOnStatus`, which the controller defines. Changes call `controller.interaction({ filterOnStatus: key })`, `controller.interaction({ filterOnSuiteUid: uid })`, and `controller.interaction({ search: value })` respectively (search is debounced 250 ms per the UI Controller Guidelines).

The dropdown has no dedicated "Skipped" option — skipped tests are reachable through the "Other" filter entry (which matches any status that is not `passed` or `failed`). Do not add a skipped option.

### Sort buttons

The sort row is built from `settings.sortBy`. The current active key is `state.sortBy`; the direction is `state.sortAscending`. Each button has three visual states:

- **Inactive** (`state.sortBy` does not match this button's key): clicking sends `{ sortBy: key }`, which starts ascending.
- **Active ascending** (key matches, `sortAscending` is `true`): clicking sends `{ sortAscending: false }`.
- **Active descending** (key matches, `sortAscending` is `false`): clicking sends `{ sortBy: '' }`, resetting to no sort.

The "Execution Order" button (key `''`) is the reset / no-sort state — it has no active-ascending or active-descending appearance (no asc/desc arrow); however it still appears visually highlighted (selected) when `state.sortBy === ''`. Clicking it always sends `{ sortBy: '' }`.

The active key and direction are stored in the hash: `sort=name&sort-order=asc` or `sort=name&sort-order=desc`; when no sort is active, `sort=` (empty).

### Loading indicator

Since everything is "local" and should run fast, no loading indicator is expected.

### Dark/light mode

Not required.

### Paging

No paging is required.

Yet, if the filtered result set contains more than 1000 tests, a warning should be displayed to indicate that the user must use filtering criteria to narrow down the list of tests and only the first 1000 items are displayed (according to the sorting order).

### Statuses

CTRF format defines the following test statues : passed, failed, skipped, pending, other.

This interface should only consider passed, failed and skipped. Any other status is regrouped under other.

### modes

The current mode is exposed by the controller via `state.mode`.

1. When mode is `'display'`, display the report content.

2. When mode is `'open'`, the application shows only an **Open Report** button. Clicking it triggers a hidden `<input type="file" accept=".json">`. When the user selects a file, the view reads it, parses the JSON, and calls `controller.interaction({ report: parsedReport })`. The controller resets state, loads the report, and emits `update({ ...state, mode: 'display' })`.

The **Open Report** button remains visible in the summary panel header in `'display'` mode, letting the user switch between reports.

Additionally, an **Export** button is always present in the summary panel header when in `'display'` mode. Clicking it calls `controller.interaction({}, 'export')`, which triggers the controller to download the current report as a JSON file.

### Reloading the page

When the user reloads the page, filters and sorting criteria should be kept: they are saved in the page hash using `pushState` to enable navigating back to previous searches (back restores the previous filter state if any).
Proposed schema is : `#suite=&status=&q=&sort=&sort-order=`

On load, if the hash contains filter/sort values, the view parses them and sends a **single** `controller.interaction({ filterOnSuiteUid, filterOnStatus, search, sortBy, sortAscending })` call before the first render.

## TODO (out of scope — do not implement)

* Make sure the focus is kept in the edit when typing text to search for a test
* Define the empty screen (when no ctrf exists)
* Makes the status optional (do not display 0 failed or 0 skipped)
* Create test reports to manually test the situations
* Disable panel animation