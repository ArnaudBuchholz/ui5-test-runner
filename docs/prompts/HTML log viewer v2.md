# HTML log viewer (v2)

> This document describes the **redesigned** HTML log viewer that replaced the
> original UI5-Web-Components / tabular implementation. The functional goal is
> unchanged — visualize the logs `ui5-test-runner` produces — but the UI is now
> an **event-stream console**: a dark, monospace, facet-driven triage view rather
> than a filterable table of columns. Where this document and the original
> `HTML log viewer.md` conflict, this one wins.

## Functional Overview

`ui5-test-runner` generates log files. A log is a record described by the type `InternalLogAttributes` defined in `src/platform/logger/types.ts`.
To help users visualize these logs, we need an HTML application.

The redesigned viewer is framed as a **live event console**: a reverse-chronological
stream of events on the right, a **facet rail** of value counts and triage shortcuts on
the left, and a raw filter-expression bar across the top. The emphasis is on *triage* —
getting from "something went wrong" to the relevant events in as few clicks as possible.

## Technical overview

* Read and follow the documented [Coding Guidelines](./Coding%20Guidelines.md).
* Follow the [UI Controller Guidelines](./UI%20Controller%20Guidelines.md) by instantiating the [LogViewerController](../../src/modes/log/ui/LogViewerController.ts).
  State, Settings and Actions are defined in [Types](../../src/modes/log/ui/types.ts).

The controller is unchanged from the first version: it owns the time range, auto-refresh,
the server-side `filter` expression, and the returned `logs` + `metrics`. Queries go to
`/query?…`; the `filter` is a `punyexpr` expression evaluated server-side (see the `filter`
doc in `types.ts` and `LogStorage.buildFilterExpression`).

### No UI framework components

The entry point still imports `../lib/index.js` (which registers UI5 Web Components),
but the viewer **renders only plain vanilla HTML elements** —
native `<div>`, `<button>`, `<select>`, `<input>` — styled entirely by its own `style.css`.
(`debounce` is imported separately from `../lib/utils/debounce.js`, a sibling helper outside
`src/ui/log`; do not re-implement it.)
There are **no `<ui5-*>` elements** in the rendered output: the datetime pickers, selects,
popovers, message strips and tags from the original design are gone, replaced by the
console's own controls. The component-mapping table from the original document no longer applies.

## Implementation structure

The code resides in `src/ui/log`. It must use:

* TypeScript
* Vanilla JavaScript (no framework)
* A hand-written dark-console `style.css`
* `vite` for bundling (`src/ui/log/vite.config.mjs`)
* `vitest` for testing

Split the implementation into small, individually unit-tested modules. Only the pure
logic is tested; `main.ts` is the thin imperative shell.

Source organisation:

```
src/ui/log/
  main.ts                      imperative shell: render dispatch, event wiring, view state
  style.css                    dark console design system
  test.html                    minimal entry shell (<div id="app">)
  vite.config.mjs
  components/
    TopBar.ts                  status + stats, free filter input, time/refresh/order controls
    FacetRail.ts               left rail: triage issues panel + value facets with counts
    EventStream.ts             the reverse-chronological event rows + inline expansion
    EventDetails.ts            expanded-row body: fields with filter chips, error, data tree
  utils/
    facets.ts                  compute per-field value counts + issue summary
    filter.ts                  facet-selection model + compile selections → punyexpr
    format.ts                  level names/icons, clock, duration, bytes formatting
```

The build output goes to `dist/ui5-test-runner-log-viewer.js` as a single
self-contained minified JavaScript file (CSS inlined).

## Clarified requirements

- Timestamps display in the local timezone.
- The event stream orders **newest-first by default** (`order: 'desc'`), with a single toggle to flip to oldest-first. (The original fixed ascending ordering is replaced by this toggle.)
- `isMainThread` is never displayed.
- No pagination: all logs returned by the query are rendered as-is.
- A **default de-noise filter** is applied on first load so the first screen shows signal, not chatter (see **Default filter**).
- Log detail is shown **inline** (an expanding region under the clicked row), not in a modal popup. Clicking the row again collapses it. Only one row is expanded at a time.
- The viewer is **filter-expression-first**: the top bar exposes the raw `punyexpr` string, and facets/chips are convenience composers that feed into it.

## Default filter

On load the view does **not** show everything. It seeds the free-expression with a
de-noise default that hides the high-volume, low-signal sources:

```
source !== "metric" && source !== "progress" && !source.includes("stdout")
```

The controller's initial query is unfiltered; the view applies this default expression
immediately after connecting so the first paint already reflects it. Users re-enable the
hidden sources from the Source facet or by editing the expression.

## Rendering contract

### Layout

Fixed-height viewport; the page itself never scrolls. The app is a CSS grid shell:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ ● Live  1 234 events  221.0s  3.4 MB   [filter expression …]           [⌫]   time refresh ↻  ↑ │  top bar (fixed)
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ error banner (only when state.errorMessage)                                                 │
├──────────────┬──────────────────────────────────────────────────────────────────────────────┤
│  ISSUES      │ 12:08:26.142  ✦ assert   should open the home page                    p16616 pg3 │
│  [3] errors  │ 12:08:26.101  ◉ browser  navigating to #/home                         p16616 pg3 │
│  [7] warns   │ 12:08:25.998  ↔ http     GET /resources/sap-ui-core.js 200            p16616     │  event stream
│  [2] pages   │ …                                                                               │  (scrolls)
│              │                                                                                 │
│  LEVEL       │                                                                                 │
│   fatal   2  │                                                                                 │
│   error   3  │                                                                                 │
│   warn    7  │                                                                                 │
│  SOURCE      │                                                                                 │
│   http  812  │                                                                                 │
│   job    43  │                                                                                 │
│  PAGE / PROCESS (scrollable)                                                                   │
└──────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

Concretely:
- `body` and `#app`: `height: 100vh; overflow: hidden`. `#app` is a `grid` with rows `auto auto 1fr` (top bar, error banner, main).
- `#ev-main` is a two-column grid: a fixed `220px` rail and a `1fr` stream, both `overflow-y: auto`, with `min-height: 0` so they scroll independently inside the viewport.
- The dark console aesthetic is intentional: monospace font, dark surfaces, level carried by a coloured left border and message tint.

### View-local vs controller state

`main.ts` keeps a small `ViewState` the controller does not own:

- `facets` — the current facet selection (`FacetSelection`, a `Map<field, Set<valueKey>>`).
- `freeExpression` — the raw expression typed in the top-bar input (seeded with the default).
- `order` — `'asc'` | `'desc'` stream direction.
- `expandedIndex` — the index into `controller.state.logs` of the inline-expanded row, or `-1`.

The compiled server filter is `compileFilter(facets, freeExpression)`: facet selections are
AND-ed as field clauses (values within a field OR-ed), then AND-ed with the trimmed free
expression. `applyFilter()` pushes that into `controller.interaction({ filter, action: 'refresh_now' })`
and collapses any expanded row.

### Controller update handling

`update(changed)` reacts granularly: a `metrics` change re-renders the top bar, a `logs`
change re-renders the stream **and** the rail (facet counts are derived from the current
log set), an `errorMessage` change toggles the error banner.

## Components

### Top bar (`components/TopBar.ts`)

Left-to-right:

- **Status + stats** — a live/replay dot (`metrics.reading` → green pulsing `Live`, else grey `Replay`), then `{logCount} events`, the time span (`formatDuration`), and the input size (`formatBytes`).
- **Filter box** — a single `<input id="ev-filter">` holding the raw `freeExpression` (facet clauses live separately and surface as rail state, not in this box), plus a `⌫` clear button (`#ev-filter-clear`). Typing is **debounced 300 ms** before it becomes the free expression and re-queries.
- **Controls** — a time-type `<select>` (`relative`/`absolute`), a relative-range `<select>` (disabled in absolute mode), an auto-refresh `<select>` (`off` + the `settings.autorefresh` keys), a refresh-now button `↻`, and an **order toggle** button showing `newest ↑` / `oldest ↓`.

The relative-range and auto-refresh selects are populated from `controller.settings`
(`relativeTimerange`, `autorefresh`). Selecting `off` sets `autorefresh: false`; any other
value sets `autorefresh: true` + `autorefreshInterval`. The order toggle is purely view-local
(re-renders the stream and bar, no re-query).

### Facet rail (`components/FacetRail.ts`)

The left rail has two parts, both derived from the **currently displayed logs**:

**Issues panel (triage shortcuts)** — three big-number buttons from `computeIssues(logs)`:
- **errors** — count of events with `level >= error`; clicking sets the expression to `level === "error" || level === "fatal"`.
- **warnings** — count of `level === warn`; clicking sets `level === "warn"`.
- **failing pages** — count of distinct `pageId`s that have at least one error/fatal **or** `source === "assert"` event; clicking sets `pageId === a || pageId === b …` for those pages.

Each is disabled when its count is zero. Clicking an issue button **replaces** the free
expression and clears all facet selections (it's a "jump straight to the problem" action).

**Value facets** — for `level`, `source`, `pageId`, `processId`, a titled group of value
buttons with live counts (`computeFacets(logs)`):
- `level` is sorted by severity (fatal→debug); the others by descending count.
- `pageId` / `processId` groups are capped to a scrollable box (`ev-facet-scroll`).
- The `undefined` value (e.g. `pageId` on non-page logs) is labelled **none** and keyed by a sentinel.
- Clicking a value toggles it in the facet selection (`toggleFacet`) and re-queries. Selected values get the `ev-facet-on` highlight. Selections within a field OR together; `facetValueKey` gives each a stable key so highlighting survives re-render.

### Event stream (`components/EventStream.ts`)

A dense list of event rows, newest-first (or oldest-first per `order`). Empty state:
`No events match the current filter.`

Each `.ev-row[data-index]` is a grid of:
- **time** — `HH:MM:SS.mmm` local clock (`formatClock`).
- **glyph** — a small per-source symbol (`sourceGlyph`): `assert ✦`, `http ↔`, `metric ▦`, `progress ▸`, `browser ◉`, `process ⚙`, `page ▭`, else `•` (purely visual; colour carries the level).
- **source** — the source string (dimmed).
- **message** — the message, truncated with ellipsis; tinted by level (error/fatal red, warn amber, debug grey).
- **badges** — compact `p{processId}` and `pg{pageId}` chips (omitted when the field is undefined).

Level is also carried by a coloured **left border** (`ev-level-{name}`). Rows additionally
get a subtle per-page hue stripe (`ev-page-{pageId % 8}`) so events from one page read as a band.

Clicking a row toggles its inline detail (`expandedIndex`); only one row is expanded at a time.

### Event detail (`components/EventDetails.ts`)

The expanded region under a row renders the full event:

- **Core fields** as `label value` rows: timestamp, level (as its string name), source, processId, threadId, and pageId (only when present), then message.
- Each filterable field value carries a pair of **filter chips** revealed on hover: `=` (append `field === value`) and `≠` (append `field !== value`). Chips store the value as JSON in `data-value` and are composed into the free expression by the host, AND-ed onto whatever is already there. (`level` chips use the string name; numeric fields stay unquoted.)
- **error** — when present, rendered prominently as a monospace `<pre>` (`name: message` + stack for `Error`s, else pretty JSON). No filter chips (its nested shape doesn't map to filters).
- **data** — when present, the structured payload is walked recursively into a tree of `label value` rows, each leaf getting `=`/`≠` chips. Field paths compose with `.` for object keys and `[i]` for array indices (e.g. `data.meta.browser`, `data.items[0]`).

Clicking a chip AND-s its clause onto the current free expression and re-queries.

### Level mapping (`utils/format.ts`)

`level` in `InternalLogAttributes` is numeric (`0`–`4`). The viewer maps it to names (and
keeps the original icons available):

|level|name|icon|HTML entity|
|---|---|---|---|
|0|`debug`|🔍|`&#128269;`|
|1|`info`|💬|`&#128172;`|
|2|`warn`|⚠️|`&#9888;&#65039;`|
|3|`error`|❌|`&#10060;`|
|4|`fatal`|💣|`&#128163;`|

In filter expressions `level` is compared against its **string name** (`level === "info"`),
while `processId`, `threadId`, `pageId` are numeric and appear **unquoted** (`processId === 16616`).
The `filter.ts` clause builders enforce this (strings double-quoted, numbers raw, `undefined`
as the keyword via the sentinel).

Other formatters: `formatClock` (time-of-day with ms), `formatDuration` (`221.0s` / `1m 05s`),
`formatBytes` (B/KB/MB/GB), `formatTimestamp` (full locale string).

## Selector & constant contract

> Event handling is **centralised in `main.ts`** via delegation, so the exact element
> IDs, CSS class names and `data-*` attributes below are a hard contract between the
> component renderers and the handlers. Reproduce them **verbatim** — a renamed class or
> attribute leaves the UI rendering correctly but silently non-interactive. All interpolated
> values must be HTML-escaped (see **Escaping**).

### Shell container IDs (`renderShell`)

`#app` is filled once with this structure; the per-region re-render functions query exactly these IDs:

| ID | Purpose | Re-rendered by |
|---|---|---|
| `#ev-topbar` | top bar (status, filter box, controls) | `metrics` change / order toggle |
| `#ev-error` | error banner; `display:none` until `state.errorMessage` is set | `errorMessage` change |
| `#ev-main` | two-column grid wrapper | once |
| `#ev-rail` | left facet rail | `logs` change |
| `#ev-stream` | event stream | `logs` change |

`update(changed)` dispatches granularly: `'metrics' in changed` → re-render bar; `'logs' in changed` → re-render **stream and rail**; `'errorMessage' in changed` → toggle banner.

### Top-bar controls

| ID | Element | Event → interaction |
|---|---|---|
| `#ev-filter` | text input holding the raw `freeExpression` | `input`, **debounced 300 ms** → set free expression + `applyFilter()` |
| `#ev-filter-clear` | `⌫` button | `click` → clear expression + `applyFilter()` |
| `#ev-timetype` | `<select>` `relative`/`absolute` | `change` → `{ timerangeType, action: 'refresh_now' }` |
| `#ev-relative` | relative-range `<select>` (disabled when absolute) | `change` → `{ relativeTimerange, action: 'refresh_now' }` |
| `#ev-refresh` | auto-refresh `<select>`; **the "off" option's `value` is the string `none`** | `change` → `none` ⇒ `{ autorefresh: false }` (no action), else `{ autorefresh: true, autorefreshInterval }` |
| `#ev-refresh-now` | `↻` button | `click` → `{ action: 'refresh_now' }` |
| `#ev-order` | order toggle (`newest ↑`/`oldest ↓`) | `click` → flip view-local `order`; **re-render stream + bar only, no re-query** |

### Facet rail (delegated on `#ev-rail`)

- **Facet value button** — class `.ev-facet-item`, attributes `data-facet="{field}"` and `data-key="{item.key}"`. Click → `toggleFacet(facets, field, key)` + `applyFilter()`. Selected state = class `.ev-facet-on`. Long value lists (`pageId`, `processId`) wrap in a `.ev-facet-scroll` box (`max-height:160px`).
- **Issue button** — class `.ev-issue`, attribute `data-issue` whose value is **exactly** one of `errors` | `warns` | `failingPages` (note `warns`, not "warnings"). The failing-pages button also carries `data-pages="{comma-separated pageIds}"`. Disabled (`disabled` attr) when its count is 0. Click (when not disabled) **replaces** `freeExpression` and **clears all facet selections**, then `applyFilter()`:
  - `errors` → `level === "error" || level === "fatal"`
  - `warns` → `level === "warn"`
  - `failingPages` → `pageId === a || pageId === b …` (from `data-pages`)

### Event stream (delegated on `#ev-stream`)

- Each row: class `.ev-row` + `data-index="{index into state.logs}"`, plus level class `.ev-level-{name}` (left-border colour) and, when `pageId` is numeric, `.ev-page-{pageId % 8}` (there must be exactly 8 rules `ev-page-0`…`ev-page-7`; the stripe is an `inset 2px 0 0 {hue}` box-shadow on the `.ev-time` cell, not a row border).
- Row grid columns: `.ev-time` `.ev-glyph` `.ev-source` `.ev-message` `.ev-badges` (`grid-template-columns: 92px 16px 110px 1fr auto`).
- Click a row → toggle `expandedIndex` (only one open at a time); re-render stream.
- **Filter chip** — the chip handler is checked **first** and calls `event.stopPropagation()` so it does not also toggle the row. Contract (rendered by `EventDetails.ts`):
  - wrapper `.ev-filter-chip` (hover-revealed), containing **two** buttons `.ev-filter-btn`.
  - each button: `data-field="{field}"`, `data-op="==="` or `data-op="!=="`, `data-value='{JSON.stringify(value)}'` (single-quoted attr).
  - `=` button uses `===`, `≠` button uses `!==`.
  - Host click: `JSON.parse(data-value)`, format (strings double-quoted, else `String()`), build `field op value`, AND it onto `freeExpression`, `applyFilter()`.

### Expanded detail (`EventDetails.ts`)

- Core field rows, in order: `timestamp`, `level` (string name), `source`, `processId`, `threadId`, `pageId` (only when present), `message`.
- **Chips appear on `level`, `source`, `processId`, `threadId`, and `pageId` only** — `timestamp` and `message` are explicitly non-filterable (no chip).
- `error` (when non-null): `error` section + `<pre>` with `name: message` + stack for `Error`s, else pretty JSON. **No chips.**
- `data` (when present): a `data` section then a recursive tree; each leaf gets chips; field paths compose `data.key` for objects and `data.arr[i]` for arrays.

### Filter compilation (`utils/filter.ts`)

- `FACET_FIELDS = ['source', 'level', 'pageId', 'processId']` — note this iteration order (for `compileFilter`) differs from the rail **display** order (`level`, `source`, `pageId`, `processId`); both are intentional and independent.
- Facet value key (`facetValueKey`): `String(value)`, except `undefined` → the sentinel `'\0undefined'` (displayed as label **none**).
- **Level facets are keyed by the string name** (`"error"`), not the number — the clause builder special-cases `level` to quote it; all other fields use `facetValueKey`.
- Clause per value: `undefined` → `field === undefined` (keyword, unquoted); `level` → `field === "name"`; `pageId`/`processId` → `field === number` (unquoted); `source` → `field === "string"`.
- Clause per field: values OR-ed; **wrapped in `( … )` only when more than one value** (precedence matters when AND-ed with the free expression).
- `compileFilter`: each field's clause AND-ed, then the trimmed `freeExpression` AND-ed last.

### Constants & formatter edge cases

- Debounce: **300 ms** on the filter input.
- Default de-noise expression (verbatim): `source !== "metric" && source !== "progress" && !source.includes("stdout")`.
- Page hue count: `% 8`.
- `formatClock`: `HH:MM:SS.mmm`; returns `—` for a falsy epoch.
- `formatDuration`: `0s` for `ms <= 0`; `{s}.{d}s` under 60 s (one decimal, e.g. `221.0s`); `{m}m {ss}s` otherwise (seconds zero-padded, e.g. `1m 05s`).
- `formatBytes`: bytes shown with no decimals, KB and up with one decimal.
- Top-bar stats come from `state.metrics` (`logCount`, `inputSize`), not `state.logs.length`; the span is `maxTimestamp > minTimestamp ? max - min : 0` fed to `formatDuration`.

### Escaping

`escapeHtml(s)` (exported from `EventDetails.ts`, reused by every component) replaces `&`, `<`, `>`, `"`. **Every** interpolated log value (source, message, data, facet labels, option labels, filter expression echoed into the input `value`) must pass through it — log content is arbitrary and untrusted.

### Empty / error states

- Empty stream: `No events match the current filter.`
- Error banner: `textContent = state.errorMessage`; shown only when non-empty.

## Target browsers

Only modern browsers; ignore Internet Explorer compatibility.

## Summary of changes from v1

- **Table → event stream.** Column-per-field table replaced by a dense reverse-chronological console stream with inline expansion.
- **No UI5 components** are rendered (datetime pickers, selects-as-UI5, popovers, message strips, tags all gone).
- **Facet rail** replaces per-column header filter popups: live value counts you click to toggle.
- **Issues panel** adds one-click triage (errors / warnings / failing pages).
- **Filter-expression-first.** The raw `punyexpr` string is a top-level editable control; facets and `=`/`≠` chips compose into it.
- **Default de-noise filter** applied on load.
- **Newest-first by default**, with an order toggle (v1 was fixed ascending).
- **Inline detail** replaces the modal log-details popup.
