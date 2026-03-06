# HTML report generator

## Overview

`ui5-test-runner` executes tests and produces a CTRF (Common Test Report Format) as documented in https://ctrf.io/.
To make this report more accessible, this JSON report must be converted to a nice HTML interface that allows the user to 
navigate the results.

## Technical overview

Read and follow the documented [Coding Guidelines](./Coding%20Guidelines.md).

### CTRF Format

The project provides an up to date description of the format in `src/types/CommonTestReportFormat.ts`.

### Implementation structure

The code of this report resides in `src/ui/report`, it must use :

* TypeScript
* Vanilla JavaScript (no framework)
* [UI5 Web Components](https://ui5.github.io/webcomponents/), use only `@ui5/webcomponents`.
* `vite` for bundling
* `vitest` for testing

Do not put everything in the `main.ts` file, split the implementation into manageable chunks which are unit tested.
Only the logic should be tested.

The build output should go in `dist/ui5-test-runner-html-report.js` in a single self-contained and minified JavaScript file (it must pack everything including css).

### Target browsers

Only modern browsers will be used, ignore Internet Explorer compatibility.

### Assumption

* About the CTRF report content :
  * If set in `window.ctrf`, the report format is assumed to be valid
  * When the user selects a file to be used, the code should validate that the file contains a valid JSON object looking like a report
  * A minimal CTRF report should contain :
```json
{
  "results": {
    "summary": {
      "failed": 0,
      "passed": 0,
      "skipped": 0,
      "start": 0,
      "stop": 0,
      "tests": 0,
      "duration": 0
    },
    "tests": [
      {
        "duration": 0,
        "name": "name",
        "status": "passed"
      }
    ]
  }
}
```
  * The following properties are always set :
    * `results.summary` structure
    * `results.tests[].name`, `results.tests[].status`, `results.tests[].duration`

  * About the test's `suite` property :
    * the `suite` property might be empty, associated test should be displayed / filtered with `no suite`
    * the `suite` property might not be an array, no hierarchical structure would then apply and the suite value would be considered a top level item

### Manual testing

The application should be locally runnable to do manual testing. Create an `html-report.html` entry point for vite.

## Expected features

### General UX

The UI should be split into 3 parts :

1. A summary part that indicates :
  * Report information (date of execution, id and tool being used). If some of these information are missing, display N/A in place of the value.
  * An overall status (success or failed)
  * Total number of tests, number of passed, failed and skipped (ignore other statuses)
  * If any other status is contained in the CTRF report, regroup them in a value called "other" (do not show this value otherwise)
  * This section can be collapsed to give more screen space for the test list. It should be expanded by default.
2. A filtering part (see **Filtering** section)
3. The list of test results (after filters were applied), showing :
  * Number of test being displayed 
  * Number of passed, failed and skipped (ignore other statuses)
  * If any other status might be displayed, regroup them in a value called "other" (do not show this value otherwise)
  * For each test to display
    * The suite hierarchy (see **Understanding suite** section) as clickable breadcrumbs (clicking one item should change the suite filter accordingly)
    * The test name
    * The status
    * Upon clicking the test, additional details might be displayed using a collapsible part that is expanded (but collapsed by default).
      * `duration`
      * `message` (if set) rendered as plain text
      * `trace` (if set) rendered as a call stack using monospace font

The page title should be "UI5 Test Runner Report".

### Wireframes

General page structure :

```
┌───────────────────────────────────────────────────────────────────────┐
│ Summary                                                           [V] │ <- button to collapse this section
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │  
│ Date           Report ID     Tool              Duration    Status     │
│ 1/1/2026 5:40  0123          ui5-test-runner   1m 0s       ❌ failed  │ <- Tool displays report.generatedBy
│                                                                       │
│ Tests (Qunit@1.2.3)                                                   | <- QUnit@1.2.3 is report.results.tool.name + @ + report.results.tool.version
│ 3 total (✅ 1 passed) (❌ 1 failed) (⏭ 1 skipped)                    │
└───────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────┐
| Suite              Status             Search                          │
| [drop down  V]     [drop down  V]     [___________]                   │
└───────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────┐
│ Tests (3)                  (✅ 1 passed) (❌ 1 failed) (⏭ 1 skipped) │
├───────────────────────────────────────────────────────────────────────┤
| Sort By : [Name] [Status] [Duration]                                  |
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

### Loading indicator

Since everything is "local" and should run fast, no loading indicator is expected.

### Dark/light mode

Not required.

### Filtering

The UI should propose the different filters :

* They are initialized upon loading the CTRF report definition
* They remains static once defined and changing one filter does not impact the content of the other filters

The filters are :

* Test suite
  * A cascading dropdown describing the suite hierarchy (please see **Understanding suite** section)
    * If a suite a single text value, it appears as a top-level item
    * Level 1 of the cascade should show top-level test suite URLs or test page URLs (if not preceeded by a test suite)
    * If at least one test has no suite, a "No suite" option should be displayed
  * Only one item can be selected in the dropdown : upon selection, this tests relative to this item and its children should be displayed
  * When selecting a parent suite, all child suites and tests must be displayed
  * The dropdown content is static and not impacted by the subsequent filters
* Test status
  * A simple dropdown showing only the statuses found in the report
* A generic text filter to search specific tests :
  * search is case insensitive
  * the search must apply on : suite or test name

The filters are combined using the AND logic.
The filters criteria must be persisted in the URL's hash so that reloading the page shows the same result.

If the filter combination generates no results, a warning message should be displayed in place of the list to say that no test match the criteria.

### Sorting

The list of test result can include sorting helpers to :

* sort by status
* sort by duration
* sort by name

The sorting criteria must be persisted in the URL's hash so that reloading the page shows the same result.
Only one sorting criteria can be applied at a time.
User should be proposed to invert sorting direction.

By default, no sort criteria is applied meaning the order should follow the `results.tests[]` array order.

### Paging

No paging is required.

Yet, if there are more than 1000 tests to be displayed, a warning should be displayed to indicate that the user must use filtering criteria to narrow down the list of tests and only the first 1000 items are displayed (according to the sorting order).

### Statuses

CTRF format defines the following test statues : passed, failed, skipped, pending, other.

This interface should only consider passed, failed and skipped. Any other status is ignored for now.

### Understanding suite

In the CTRF report, the `suite` property describes a a hierarchy of execution :

* It contains a list of values that can be either URLs or textual values.
* Some URLs are pages pointing to other URLs, they are called test suites.
* Some URLs are test pages, they generate modules and tests.

For instance, the following suite value :

```json
{
  "suite": [
    "https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/testsuite.qunit.html",
    "https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/Test.qunit.html?testsuite=test-resources/sap/ui/demo/cart/testsuite.qunit&test=integration/opaTestsComponent",
    "Buy Product Journey"
  ]
}
```

Means that :
  * The URL https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/testsuite.qunit.html is a test suite that provided the URL https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/Test.qunit.html?testsuite=test-resources/sap/ui/demo/cart/testsuite.qunit&test=integration/opaTestsComponent
  * The URL https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/Test.qunit.html?testsuite=test-resources/sap/ui/demo/cart/testsuite.qunit&test=integration/opaTestsComponent is a test page which contains the module "Buy Product Journey"

It may happen that the same test URLs is introduced by different test suites, they must be distinguished in the UI.
That means that a test is uniquely identified by the value of `suite` and name.
In the unlikely event that two tests under the same suite have the same name, it is OK if the UI can't distinguish them for filtering. But they must be both displayed.

As suite URL can be very long, try to prettify them to display at least the page name (all URLs will likely have the same origin and base path). A tooltip should be associated to display the full value.

A suite URL is not clickable.

### Getting the CTRF content

There are two ways for the application to get the CTRF report to render :

1. If `window.ctrf` exists and is an `object`, it contains the CTRF JSON to use.

The runner will generate a custom HTML page containing the application JavaScript and some custom code setting the value.

For instance :
```html
<script>window.ctrf = { ... }</script>
<script src="dist/ui/report/report.js"></script>
```

When `window.ctrf` is set, the `Open` button **must not** be displayed.

2. Otherwise, the application should offer an `Open` button which prompts the user to select which CTRF file to open.

Until the user selected a file, an empty report should be displayed.

The button remains visible after opening a report, letting the user switch between reports.

Current sorting / filtering criteria should be kept (if matching the new report definition) or reset (when no matching value exist).
For instance :
- if the new report does not have the currently selected suite, the suite filter should be back to "none" meaning all suites are displayed
- if the selected status does not exist in the new report, the status filter should be back to "all"
- ...

If the CTRF content is invalid, the report should do its best to render the content but also display a top level warning saying "The report appears to be invalid" with no further information.

### Reloading the page

When the user reloads the page, filters and sorting criteria should be kept: they are saved in the page hash using `pushState` to enable navigating back to previous searches (back restores the previous filter state if any).
Proposed schema is : `#suite=&status=&q=&sort=&sort-order=`

If no `window.ctrf` exists, the user has to re-open a report definition.
