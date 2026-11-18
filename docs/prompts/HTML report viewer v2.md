# HTML report viewer (v2)

> This document describes the **redesigned** HTML report viewer that replaced the
> original UI5-Web-Components implementation. The functional goal is unchanged —
> turn a CTRF JSON report into a navigable HTML interface — but the delivery is
> now a **dependency-free, vanilla design system** with a virtualized test list,
> a suite sidebar, and light/dark theming. Where this document and the original
> `HTML report viewer.md` conflict, this one wins.

## Functional Overview

`ui5-test-runner` executes tests and produces a CTRF (Common Test Report Format) as documented in https://ctrf.io/.
To make this report more accessible, this JSON report must be converted to a nice HTML interface that allows the user to navigate the results.

## Technical overview

Follow the [UI Controller Guidelines](./UI%20Controller%20Guidelines.md) with:
- **controller_source** = `src/reports/ui/ReportController.ts`
- **types_source** = `src/reports/ui/types.ts`
- **output_path** = `src/ui/report`
- **dist_name** = `dist/ui5-test-runner-html-report.js`

### No UI framework

Unlike the first version, this viewer **does not use UI5 Web Components** (or any
other component library). It is pure TypeScript + vanilla DOM + a hand-written CSS
design system. There is no `@ui5/webcomponents` import and no `../lib/index.js`
import in the report entry point. Every control (buttons, `<select>`, `<input type="search">`)
is a native HTML element styled by `style.css`.

The rationale: the report is a self-contained artifact shipped alongside test runs,
and dropping the component library keeps the bundle small and the rendering instant.

### Implementation structure

The code resides in `src/ui/report`. It must use:

* TypeScript
* Vanilla JavaScript (no framework)
* A single hand-written `style.css` design system (tokens defined once, see **Theming**)
* `vite` for bundling (`src/ui/report/vite.config.mjs`)
* `vitest` for testing

Split the implementation into small, individually unit-tested modules rather than
one large `main.ts`. Only the pure logic is tested — `main.ts` is the imperative
shell that wires DOM events to the controller and is intentionally thin on logic.

The source is organised as:

```
src/ui/report/
  main.ts                      imperative shell: render dispatch, event wiring, boot
  style.css                    the whole design system (tokens, layout, components)
  test.html                    minimal entry shell (<div id="app">)
  vite.config.mjs
  components/
    Header.ts                  top header: title, pass/fail pill, run metadata, actions
    SummaryBar.ts              count chips + proportional pass/fail/skip/other bar
    SuiteTree.ts               left sidebar: suite hierarchy with per-suite counts
    Toolbar.ts                 status filter, search, sort controls, "N of M shown"
    TestTable.ts               virtualized test list (thead + windowed body)
    TestDetails.ts             expanded-row body: duration, message, diff, stack, assertions, images
    Configuration.ts           collapsible raw-config JSON panel
    testFixture.ts             test-only helper to build CTRF fixtures for specs
  utils/
    format.ts                  duration formatter (ms → "42ms" / "12s" / "1m 0s")
    escapeHtml.ts              HTML-escape for safe string interpolation
    hash.ts                    read/write the URL hash filter/sort state
```

The build output goes to `dist/ui5-test-runner-html-report.js` as a single
self-contained minified JavaScript file (CSS inlined).

### CTRF Format

The project provides an up-to-date description of the format in `src/types/CommonTestReportFormat.ts`.

About the CTRF report content, the following properties are always set:

  * `results.summary` structure (including `duration`)
  * `results.tests[].name`, `results.tests[].status`, `results.tests[].duration`

### Understanding suite

`results.tests[].suite` is an optional `readonly [string, ...string[]]` — an array of strings representing the hierarchy from the top-level container down to the immediate parent of the test.

Example: `['Module A', 'Component B']` means the test is nested as **Module A → Component B → test name**.

The controller builds a `Suite` tree from the **full** test list (not the filtered one) and exposes it as `state.suites`. Each node (`src/reports/ui/types.ts`) has:
- `uid` — cumulative path elements joined with the `SUITE_SEPARATOR` (`'\r'`, see `src/reports/ui/suites.js`)
- `label` — display text (URL-like entries are automatically shortened)
- `suites` — nested child suites

For `['Module A', 'Component B']` the UIDs are:
- "Module A" → `uid = 'Module A'`
- "Component B" → `uid = 'Module A\rComponent B'`

**Breadcrumbs are pre-computed by the controller.** On load, the controller injects a
`[BREADCRUMBS]` symbol property onto each test (`TestAndBreadcrumbs`) holding the resolved
`Suite[]` path. The view reads `test[BREADCRUMBS]` and renders the labels joined by `›` as the
suite cell in each row (read-only text, not clickable links — suite navigation happens through
the sidebar tree, see below).

### Duration formatting

A single helper (`utils/format.ts`) formats all durations. Input is always milliseconds:

| Range | Format | Example |
|---|---|---|
| < 1 000 ms | `{N}ms` | `42ms` |
| 1 000 ms – 59 999 ms | `{N}s` (rounded to nearest second) | `12s` |
| ≥ 60 000 ms | `{M}m {S}s` | `1m 0s` |

## Clarified requirements

- The report is **framework-free**: no UI5, no component library.
- The summary is a compact **always-visible bar** at the top (no collapse/expand of the whole summary section — the old "collapsed by default" summary panel is gone).
- The test list is **virtualized** (windowed rendering) so reports with tens of thousands of tests render and scroll smoothly; there is therefore **no 1000-row cap or warning** (the original paging warning is removed).
- Suite filtering is driven by a persistent **left sidebar tree**, not a popover.
- A **light/dark theme toggle** is provided; the default follows the OS `prefers-color-scheme`.
- Filters and sort are kept in the URL hash across reloads and back/forward navigation.
- The report can be opened from a file, pre-embedded via `window.ctrf`, or exported back to JSON.

## Page layout

Fixed-height app shell; the test list is the only vertically scrolling region.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ UI5 Test Runner Report   (✓ Passed)   Tool … Date … Duration … Browser … OS …   [◐][Open…][Export] │  header
├──────────────────────────────────────────────────────────────────────────────────┤
│ 3 total  (✓3 passed) (✗1 failed) (○1 skipped) (?0 other)   ▮▮▮▮▮▮▯▯   (proportional bar) │  summary
├───────────────┬──────────────────────────────────────────────────────────────────┤
│ Suites        │ Status [All ▾]  Search [________]  Sort [Execution order ▾] [↑]   N of M shown │  toolbar
│  All tests  12│ ─────────────────────────────────────────────────────────────────┤
│  Module A ✗1 6│ Status │ Test                │ Suite           │ Duration         │  thead
│   Comp. B   4 │ ───────────────────────────────────────────────────────────────── │
│  Module D   6 │ ✓ passed │ should open app    │ Module A › Comp │ 100ms            │  (virtualized rows)
│               │ ✗ failed │ should save        │ Module A › Comp │ 240ms            │
│               │   …                                                                │
│               │ ───────────────────────────────────────────────────────────────── │
│               │ ▸ Configuration                                                    │  config panel
└───────────────┴──────────────────────────────────────────────────────────────────┘
```

### Theming

`style.css` defines the full design system as CSS custom properties (surfaces, ink,
hairlines, accent, and the reserved status colors `--passed`/`--failed`/`--skipped`/`--other`)
under `:root`. Dark mode is expressed twice so both automatic and manual selection work:

- `@media (prefers-color-scheme: dark) :root:where(:not([data-theme='light']))` — follow the OS unless the user forced light.
- `:root[data-theme='dark']` — explicit dark, set by the toggle.

The theme toggle (`#themeBtn`, label `◐`) flips `document.documentElement.dataset.theme`
between `'light'` and `'dark'`, seeding from the current OS preference on first click.
Status colors are always accompanied by an icon and a text label so meaning never relies on colour alone.

## Expected features

### Header

`components/Header.ts` renders a single header row:

- **Title** — `UI5 Test Runner Report`.
- **Overall status pill** — `✗ Failed` (class `pill--fail`) when `summary.failed > 0`, otherwise `✓ Passed` (class `pill--pass`).
- **Run metadata** — a row of `label value` items, each omitted entirely when its value is empty (there is no "N/A" placeholder except for Date):
  - **Tool** — `results.tool.name` + `@` + `results.tool.version` (the `@version` part omitted when version absent).
  - **Date** — `report.timestamp` formatted with the browser locale; `N/A` when absent or unparseable.
  - **Duration** — `summary.duration` via the duration formatter (omitted when undefined).
  - **Browser** — `environment.extra.browserName` + ` ` + `environment.extra.browserVersion` (version optional; whole item omitted when no browser name).
  - **OS** — synthesized from `environment.extra.machine` + `environment.extra.cpus` via the shared `formatHostLabel` helper (`src/utils/shared/host.ts`), e.g. `arm64 / 8x Apple M2`; falls back to `environment.osPlatform`; item omitted when all absent.
- **Actions** — `◐` theme toggle (`#themeBtn`), `Open…` (`#openBtn`), `Export` (`#exportBtn`). All three are always present in display mode.

### Summary bar

`components/SummaryBar.ts` renders a compact one-line summary (no collapsible panel):

- **Count chips** — `{N} total`, then one chip per status: `✓ passed`, `✗ failed`, `○ skipped`, `? other`, each with its status colour class. "Other" is computed as `summary.pending + summary.other`.
- **Proportional bar** — a horizontal `propbar` whose non-zero segments are flex-sized by their count (`flex:{count} 0 auto`) with a small `min-width` floor so a handful of failures against tens of thousands of passes stays visible. Zero-count segments are omitted. The bar carries an `aria-label` describing the four counts.

### Suite sidebar (`components/SuiteTree.ts`)

A persistent left `<nav id="suiteTree">` listing the suite hierarchy as an always-expanded tree:

- A leading **All tests** node (`data-suite-uid=""`) with the grand total count; highlighted when `state.filterOnSuiteUid === ''`.
- One `tnode` per suite, indented by depth (`padding-left: 0.5 + depth*0.85 rem`), showing:
  - a twisty glyph (`▾` for parents, blank for leaves — decorative, the tree never collapses),
  - the suite `label` (title-attributed for overflow),
  - a red **fail badge** `✗{n}` when that suite (including descendants) has failing tests,
  - the total test count for that suite subtree.
- Per-suite counts are aggregated by `countBySuite`: a test contributes to **every** suite uid that is a prefix of its path, matching how the controller filters on `filterOnSuiteUid` (`startsWith`).
- The synthetic `NO_SUITE_ID` node is dropped from the tree (it shares uid `''` with "All tests").
- Clicking any node sends `controller.interaction({ filterOnSuiteUid: uid })` (the uid is stored URL-encoded in the `data-suite-uid` attribute and decoded on click), clears the expanded-row state, and writes the hash. The node matching `state.filterOnSuiteUid` gets the `tnode--active` class.

### Toolbar (`components/Toolbar.ts`)

A single filter/sort row bound to controller state:

| Control | Element | Controller field | Options source |
|---|---|---|---|
| Status filter | `<select id="statusSelect">` | `state.filterOnStatus` | `settings.filterOnStatus` |
| Search | `<input id="searchInput" type="search">` | `state.search` | — (debounced 250 ms) |
| Sort key | `<select id="sortSelect">` | `state.sortBy` | `settings.sortBy` |
| Sort direction | `<button id="sortDirBtn">` (`↑`/`↓`) | `state.sortAscending` | — (disabled when no sort key) |

- The status dropdown has **no "Skipped" option** — skipped tests are reached via the **Other** entry (any status that is not `passed`/`failed`). Keys come from `FILTER_ON_STATUS`: `''` (All Statuses), `passed`, `failed`, `other`.
- Sort uses a **dropdown + direction button** (replacing the original three sort buttons). Keys come from `SORT_BY`: `''` (Execution order), `name`, `duration`. The direction button shows `↑`/`↓` and is disabled when `sortBy === ''` (execution order has no direction).
- A trailing `N of M shown` label reports `state.tests.length` of `summary.tests`.
- Every interaction clears the expanded-row and measured-height view state, calls `controller.interaction({...})`, and writes the hash.

### Test list (virtualized) — `components/TestTable.ts`

The list is **windowed**: only the rows intersecting the viewport (plus an overscan of 6) are in the DOM at any time. This is what makes the 1000-row cap unnecessary.

- `renderThead()` emits the sticky column header: **Status | Test | Suite | Duration**.
- `renderTableWindow(state, expanded, heights, scrollTop, viewport)` builds a full-height `table__sizer` with an absolutely-positioned `table__window` holding just the visible rows:
  - A prefix-offset array (`Float64Array`) gives each row's top `y`; collapsed rows use `ROW_HEIGHT = 33px`, expanded rows use their **measured** height.
  - The first visible row is found by scanning from a cheap estimate; `OVERSCAN` rows are added above and below.
  - The window `div` is translated to `offsets[start]` and tagged with `data-start`.
- Each row is a `.row[data-index]` containing a `.row__head` (status cell, test name, suite breadcrumb text, duration) and, when expanded, the detail body.
- Rows use the array index into `state.tests` as their stable `data-index`.
- Empty state: `No tests match the current filters.`

**Height reconciliation.** When a row is expanded (or an inner Assertions section toggled), `main.ts` measures the rendered `.row` height; if it differs from what the window was laid out with, it stores the measured height and re-renders the window so the sizer and offsets stay correct regardless of detail content.

**Status cell** maps status → icon: `passed ✓`, `failed ✗`, `skipped ○`, `pending ◔`, `other ?`. For an unknown status only the **colour class** falls back to `other` (`status--other`); the icon falls back to `?` and the **text label stays the raw status string** (not the word "other"). Icon + text label are always shown together.

### Expanded test detail — `components/TestDetails.ts`

Clicking a row's `.row__head` toggles a plain `<div class="details">` below it (no `<ui5-panel>`). It is a sequence of labelled `drow` rows, each shown only when its field is present:

- **Duration** — always, via the duration formatter.
- **Message** — `test.message` as plain escaped text (when set).
- **Diff** — when a test has `test.extra.actual` and/or `test.extra.expected`: an inline `actual <code>…</code>` / `expected <code>…</code>` pair in monospace. (Shown whenever the extra fields exist, not gated on status.)
- **Stack** — `test.trace` in a monospace `<pre class="trace">` (when set).
- **Assertions** — when `test.extra.QUnitLogs` is non-empty: a collapsible section (collapsed by default) with a `▸/▾` toggle button labelled `Assertions (N)`. Each entry renders a pass/fail icon (`✓`/`✗` from `log.result`), the `log.message` (or `—`), and for failures an inline `actual`/`expected` pair in monospace. The toggle flips the body's `display` and re-measures the row so the virtualized layout reconciles.
- **Screenshot** — `test.screenshot` (a single `image/png` failure screenshot filename) rendered as a lazy thumbnail under a **Screenshot** label.
- **Attachments** — `test.attachments[]` rendered under an **Attachments** label; each `image/*` attachment becomes a lazy thumbnail captioned by its `name`; non-image attachments render as a plain `<a target="_blank">name</a>` link.

### Images (lazy, on-demand)

Thumbnails (`img.att__thumb[data-src]`) carry their filename in `data-src` and **no `src`** until their row is expanded. On expand, `main.ts` sets `src = data-src` (lazy load happens **only when a row is toggled open**, not on scroll/re-render — do not wire an IntersectionObserver). On the image's `error` event, the `src` is removed, the class `att__thumb--error` is added, `textContent` is set to `Unavailable`, and `title` is set to the literal string `Unavailable: {path}`. Clicking a thumbnail opens the full image via `window.open(path, '_blank')`. Paths are relative to the HTML page itself. Neither the Screenshot nor Attachments row appears when its field is absent/empty.

### Configuration panel (`components/Configuration.ts`)

When `report.extra.configuration` is present, a collapsible **Configuration** section is rendered at the bottom of the content column: a `▸/▾` toggle button (`#configToggle`, `aria-expanded`) revealing the configuration pretty-printed as escaped JSON in a `<pre>`. Rendered as nothing when there is no configuration.

### Modes and data entry

`state.mode` is exposed by the controller and starts in `'open'`.

1. **`'open'` mode** — the app shows only the title and an **Open Report** button. Clicking it triggers a hidden `<input type="file" accept=".json">`; on selection the view reads and `JSON.parse`s the file and calls `controller.interaction({ report })`. The controller resets state, builds the suite tree, injects breadcrumbs, and emits `mode: 'display'`.

2. **`'display'` mode** — the full report UI. The **Open…** button stays in the header so the user can switch reports.

3. **Pre-embedded report** — on boot, if `window.ctrf` is a non-null object, the view immediately calls `controller.interaction({ report: window.ctrf })`. This lets the runner ship a report with its data inlined (no file picker needed).

4. **Export** — the always-present **Export** button calls `controller.interaction({ action: 'export' })`; the controller downloads the current `state.report` as `report.json` via a Blob + object-URL anchor.

### Reloading & history (`utils/hash.ts`)

Filters and sort are persisted in the URL hash so reloads and back/forward restore them. Schema: `#suite=&status=&q=&sort=&sort-order=`.

- `readHash()` parses the hash into a partial state (`filterOnSuiteUid`, `filterOnStatus`, `search`, `sortBy`, `sortAscending` where `sort-order` is `asc` unless literally `desc`). Only keys actually present are returned.
- `writeHash(state)` serialises the five fields and `history.pushState`es a new `#…` entry (so back navigates between searches).
- On load, if the hash is non-empty, the view sends a **single** `controller.interaction(hashState)` before the first render.
- A `popstate` listener re-applies the hash state (clearing expanded/height view state) so browser back/forward restores previous filters.

### Loading indicator / paging / dark mode

- **Loading indicator** — none; everything is local and instant.
- **Paging** — none, and crucially **no 1000-row warning**: the virtualized list handles arbitrarily large result sets.
- **Dark/light mode** — now **supported** via the theme toggle (this reverses the original "not required").

### Statuses

CTRF defines passed, failed, skipped, pending, other. This interface considers passed, failed and skipped directly; any other status is regrouped under **other** (`pending + other`).

## Selector & constant contract

> Event handling is **centralised in `main.ts`** via delegation, so the element IDs, CSS
> class names and `data-*` attributes below are a hard contract between the component
> renderers and the handlers. Reproduce them **verbatim** — a renamed class or attribute
> leaves the UI rendering correctly but silently non-interactive. All interpolated values
> pass through `escapeHtml` (`utils/escapeHtml.ts`).

### IDs the handlers bind to

| ID | Element | Event → effect |
|---|---|---|
| `#app` | render root; filled with open-mode or display-mode markup | — |
| `#themeBtn` | `◐` theme toggle | `click` → flip `documentElement.dataset.theme` between `light`/`dark`, seeding from OS preference on first click |
| `#openBtn` | Open… (present in both modes) | `click` → `fileInput.click()` |
| `#exportBtn` | Export | `click` → `{ action: 'export' }` |
| `#statusSelect` | status `<select>` | `change` → clear expanded/heights, `{ filterOnStatus }`, write hash |
| `#searchInput` | `<input type="search">` | `input`, **debounced 250 ms** → clear expanded/heights, `{ search }`, write hash |
| `#sortSelect` | sort-key `<select>` | `change` → clear expanded/heights, `{ sortBy }`, write hash |
| `#sortDirBtn` | `↑`/`↓` direction button; `disabled` when `sortBy === ''` | `click` → clear expanded/heights, `{ sortAscending: !current }`, write hash |
| `#suiteTree` | left `<nav>`; delegation root | `click` → see suite tree |
| `#table` | scrolling virtualization container; delegation root | `scroll` → `renderTable()`; `click` → see table |
| `#configToggle` | `▸/▾` Configuration toggle | `click` → flip `#configJson` display + `aria-expanded` + twisty |
| `#configJson` | `<pre>` holding config JSON; **starts `style="display:none"`** | toggled by reading `style.display === 'none'` |

> The open/closed state of both the Configuration panel and the per-row Assertions section
> is driven by inline `style="display:none"` and flipped by reading `=== 'none'` — **not** by
> a CSS class. Reproduce that exact mechanism or the first click won't open.

### Suite tree (delegated on `#suiteTree`)

- Each node: class `.tnode` (active node adds `.tnode--active`), attribute `data-suite-uid="{encodeURIComponent(uid)}"`. The "All tests" node uses `data-suite-uid=""`.
- Click: `closest('[data-suite-uid]')`, `decodeURIComponent` the attr, clear expanded/heights, `{ filterOnSuiteUid }`, write hash.
- Per-suite counts (`countBySuite`): a test bumps **every** cumulative `segments.join(SUITE_SEPARATOR)` prefix of its path (so a parent counts all descendants). Fail badge `✗{n}` when `failed > 0`. The synthetic `NO_SUITE_ID` node is dropped (it shares uid `''` with "All tests").

### Table (delegated on `#table`)

- Row wrapper: `.row` with `data-index="{index into state.tests}"`.
- Row head: `.row__head` — **also carries `data-index`** (the toggle handler reads the index off the head, not the wrapper). Collapsed head height must equal `ROW_HEIGHT` (see constants).
- Click handler order: check `closest('.assert-toggle')` **first**; else `closest('.row__head')` → `toggleRow(index)`.
- **Assertions** inner collapsible: button `.assert-toggle` with `data-assert-index="{row index}"`; body `.assert-body` with the **same** `data-assert-index`, starting `style="display:none"`. The index is the **row index** (passed from `renderTableWindow` → `renderTestDetails(test, index)` → `renderAssertions(logs, index)`), not a per-assertion index.
- Twisty glyphs are flipped by rewriting the toggle's leading `▸`/`▾` on its text label.

### Lazy images

- Selector `img.att__thumb[data-src]`; screenshot thumbnail has `alt="screenshot"` and no caption; attachment thumbnails are captioned by `name`.
- Loaded on row expand only. Error handler: remove `src`, add `.att__thumb--error`, `textContent='Unavailable'`, `title='Unavailable: {path}'`.

### Constants

- `ROW_HEIGHT = 33` (px). **Tied to the CSS `.row__head` box** (`0.4rem` vertical padding + 14px font + 1px border ≈ 33px); if you change that box, change this constant, or scroll math desyncs.
- `OVERSCAN = 6` rows above and below the viewport.
- Search debounce: **250 ms** (`debounce` imported from `../lib/utils/debounce.js`, a sibling outside `src/ui/report` — do not re-implement).
- SummaryBar segment: inline `style="min-width:3px;flex:{count} 0 auto"`; zero-count segments omitted; propbar carries `role="img"` + an `aria-label` listing the four counts. The `{N} total` chip has no icon/colour class; the four status chips do.
- Hash schema: `#suite=&status=&q=&sort=&sort-order=`; `sort-order` is `asc` unless literally `desc`; `writeHash` uses `history.pushState`.
- `update(changed)` re-renders the shell only when `'mode'`, `'report'`, or `'tests'` is in the diff.

### Virtualization window algorithm (`renderTableWindow`)

Reproduce this exactly — a naive version produces blank edges or off-by-overscan gaps:

```
tests = state.tests; if empty → render .table__sizer with .empty "No tests match the current filters."

// prefix offsets: offsets has length tests.length + 1; offsets[0] = 0
for i in 0..tests.length-1:
  h = expanded.has(i) ? (heights.get(i) ?? ROW_HEIGHT) : ROW_HEIGHT
  offsets[i+1] = offsets[i] + h
totalHeight = offsets[tests.length]

top = max(0, scrollTop); bottom = scrollTop + viewport
// find first visible, correcting in both directions from a cheap estimate
start = clamp(floor(top / ROW_HEIGHT) - OVERSCAN, 0, tests.length-1)
while start > 0 and offsets[start] > top: start--
while start < tests.length-1 and offsets[start+1] <= top: start++
start = max(0, start - OVERSCAN)          // OVERSCAN applied a SECOND time here
end = start
while end < tests.length and offsets[end] < bottom: end++
end = min(tests.length, end + OVERSCAN)

render: <div class="table__sizer" style="height:{totalHeight}px">
          <div class="table__window" style="top:{offsets[start]}px" data-start="{start}"> rows start..end-1 </div>
        </div>
```

### Height reconciliation (`measureExpanded`)

After rendering, measure expanded rows and reconcile so the sizer/offsets stay correct:

```
changed = false
for index in expanded:
  row = table.querySelector('.row[data-index="{index}"]'); if missing → continue
  measured = row.offsetHeight
  if abs((heights.get(index) ?? ROW_HEIGHT) - measured) <= 1: continue   // 1px tolerance — WITHOUT it you get an infinite re-render loop on sub-pixel jitter
  heights.set(index, measured); changed = true
if changed: re-render the window (renderTableWindow with updated heights)
```

On collapse, delete the index from **both** `expanded` and `heights`. Every filter/sort/suite interaction clears both maps entirely before re-rendering.

## Out of scope / notes

- The suite cell in each row is read-only breadcrumb text; suite navigation is the sidebar's job.
- There is no focus-retention special-casing for the search field beyond native behaviour.
- The empty-report screen is the `'open'` mode prompt.
