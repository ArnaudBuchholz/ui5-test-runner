# ADR-0008: UI Controller Pattern

## Status
Accepted

## Context

`ui5-test-runner` ships two interactive browser UIs: a report viewer (renders CTRF test results) and a log viewer (queries and displays compressed trace logs). Both need to:

1. **Manage non-trivial state**: filtering, sorting, pagination, time-range selection, auto-refresh intervals — state that must be consistent between the view and the data layer
2. **Handle user interactions and data updates without a full framework**: importing React or Vue into browser bundles injected into test pages is impractical; the UIs must be self-contained
3. **Support polling and auto-refresh**: the log viewer fetches new data on an interval; cancellation must be clean when the interval changes or the UI is torn down
4. **Keep the view as a pure rendering function**: application logic that leaks into DOM event handlers becomes untestable; the controller must be the single source of truth
5. **Be testable in Node.js**: controller logic runs in Vitest; no browser globals should be required for unit tests

A naive approach — event handlers that mutate DOM state directly — leads to duplicated state, untestable logic, and inconsistent UI. An existing framework would solve these problems but adds bundle size, a learning curve, and coupling to framework lifecycle hooks.

## Decision

All browser-side UIs are implemented using a typed **`AbstractUserInterfaceController`** base class that enforces a diff-only, optimistic-update MVC protocol. The controller is the single source of truth; the view is a rendering function of the controller's state.

```
  ┌─────────────────────────────────────────────────────────────┐
  │  View (DOM / browser)                                       │
  │                                                             │
  │  controller.connect(update)  ◄── initial wiring             │
  │  controller.interaction(event) ◄── user action              │
  │                                                             │
  │  update(stateDiff) callback ──► re-render changed fields    │
  └──────────────────┬────────────────────────┬─────────────────┘
                     │ interaction()          │ update()
                     ▼                        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  AbstractUserInterfaceController<Settings, State, Actions>  │
  │                                                             │
  │  _state: State          (source of truth)                   │
  │  _settings: Settings    (read-only config for the view)     │
  │                                                             │
  │  connect(update)  ──► stores callback, calls _onConnect()   │
  │  interaction(event):                                        │
  │    1. _update(stateFields)  ──► diff, mutate, forward       │
  │    2. _onInteraction(diff, action?)  ──► subclass logic     │
  │  _update(diff)  ──► prune unchanged keys, notify view       │
  └──────────────────────────────────────────────────────────┬──┘
                                                             │
                    ┌────────────────────────────────────────┘
                    │  subclass implements _onInteraction()
                    ▼
  ┌──────────────────────────┐   ┌────────────────────────────┐
  │  ReportController        │   │  LogViewerController       │
  │                          │   │                            │
  │  _onInteraction:         │   │  _onInteraction:           │
  │   - rebuild suite tree   │   │   - fetch /query endpoint  │
  │   - filter / sort tests  │   │   - manage setInterval     │
  │   - export action        │   │   - refresh_now action     │
  └──────────────────────────┘   └────────────────────────────┘
```

### Interface Contract

`IUserInterfaceController<Settings, State, Actions>` defines four members:

| Member | Type | Purpose |
|---|---|---|
| `state` | `Readonly<State>` | Current state snapshot (read-only to callers) |
| `settings` | `Readonly<Settings>` | Immutable UI configuration (enumerable option lists, labels) |
| `connect(update)` | `(event: Partial<State>) => void` | Wire the view; fires `_onConnect()` |
| `interaction(event)` | `UIEvent<State, Actions>` | Deliver user input and/or an action name |

`UIEvent<State, Actions>` = `Partial<Writable<State>> & { action?: Actions }`.

### Optimistic-Update Protocol

The interaction flow is unidirectional for the happy path:

```
// ✅ Correct: UI applies interaction optimistically, controller corrects only if needed
controller.interaction({ filterOnStatus: 'failed' });
// → view assumes state is now { filterOnStatus: 'failed' }
// → controller calls _update() only if the result differs from what the view assumed

// ❌ Avoid: waiting for controller confirmation before rendering
controller.interaction(event);
// do not hold rendering until an update() callback arrives
```

This eliminates round-trip confirmation noise. The controller calls `update(diff)` only to reject or correct — never to echo an already-correct state back. Consequently, `_update()` prunes unchanged keys before notifying the view; a no-op interaction never triggers a re-render.

### Diff-Only State Updates

`_update(stateDiff)` (protected, for controller-initiated changes):
1. Removes keys where `stateDiff[k] === this._state[k]`
2. `Object.assign(this._state, prunedDiff)` — mutates state in place
3. Calls `_updateCb(prunedDiff)` only if diff is non-empty

The view receives only changed fields; it re-renders only what changed.

### Action Dispatch

`Actions` is a string union (e.g. `'refresh_now'` | `'export'`). When `interaction({ action: 'refresh_now' })` is called, `_onInteraction` receives the action name and calls `this[action]()`. The `Actions` type therefore must exactly match method names on the subclass. This is a naming convention enforced by the TypeScript type system at the call site.

### Auto-Refresh (`LogViewerController`)

`LogViewerController` manages a `setInterval` handle:

- **`_onConnect()`**: fires an initial query; auto-switches to absolute time-range if the oldest log entry is more than 5 minutes old
- **`_startAutorefresh()`** / **`_stopAutorefresh()`**: start/stop `setInterval(() => void this.refresh_now(), interval)`
- When `autorefresh` or `autorefreshInterval` changes in `_onInteraction`: stop the current interval and restart with the new value

The `refresh_now` action builds a query object (`from`/`to` for absolute range, `from = Date.now() - relativeTimerange` for relative), fetches `GET /query?...` from the REserve server, and calls `_update({ logs, metrics })` on success or `_update({ errorMessage })` on failure.

### Debug Traces

`AbstractUserInterfaceController` emits `console.log` traces unconditionally on every `connect`, `_update`, and `interaction` call (prefixed with `🎮🔛`, `🎮⏩`, `🎮⏪`). These are production code — they aid debugging of the bidirectional controller-UI communication in browser devtools. Test files suppress them with `vi.spyOn(console, 'log').mockImplementation(() => {})`.

### Build System

Each UI is a self-contained browser bundle built with Vite:

- Format: `iife` (no module system dependency)
- CSS: `vite-plugin-css-injected-by-js` (styles injected at runtime, no separate stylesheet)
- Minifier: terser

The controller and view code are bundled together. The controller has no browser-API dependencies (no `window`, `document`, `fetch`) in its base class — only concrete subclasses call browser APIs. This keeps the base class unit-testable in Vitest without jsdom.

## Conventions

### Implementing a New Controller

```typescript
// ✅ Correct: extend the abstract base, type all three generics

interface MySettings { options: string[] }
interface MyState   { value: string; loading: boolean }
type MyActions = 'reset'

class MyController extends AbstractUserInterfaceController<MySettings, MyState, MyActions> {
  constructor() {
    super()
    this._settings = { options: ['a', 'b'] }
    this._state    = { value: 'a', loading: false }
  }
  protected _onInteraction(diff: Partial<MyState>, action?: MyActions): void {
    if (action === 'reset') this._update({ value: 'a' })
    if (diff.value) void this._fetch(diff.value)
  }
  private async _fetch(value: string): Promise<void> {
    this._update({ loading: true })
    const data = await fetch(`/data?v=${value}`).then(r => r.json())
    this._update({ loading: false, value: data.result })
  }
}

// ❌ Avoid: mutating _state directly without going through _update()
this._state.loading = true  // view will not be notified
```

### Wiring a View

```typescript
// ✅ Correct: connect once, apply diffs incrementally
const controller = new MyController()
controller.connect(diff => Object.assign(viewState, diff) && render())

// ✅ Correct: pass state changes and actions together when needed
controller.interaction({ value: 'b', action: 'reset' })

// ❌ Avoid: reading controller.state after interaction to check the result
controller.interaction({ value: 'b' })
const current = controller.state.value  // race: _onInteraction may be async
```

## Consequences

### Positive
- ✅ **Testable without a browser**: controller logic is pure TypeScript with no DOM dependency in the base class; full unit test coverage in Vitest
- ✅ **Consistent protocol**: every UI follows the same connect/interaction/update cycle; adding a new UI means extending one class and implementing one method
- ✅ **Diff-only updates reduce re-render scope**: views can cheaply check which fields changed rather than diffing the full state tree
- ✅ **Auto-refresh is self-contained**: interval management lives entirely in the controller; the view has no timer state

### Negative/Trade-offs
- ❌ **Action dispatch is stringly-typed at runtime**: `this[action]()` is checked by TypeScript at the call site but not at runtime; a misspelled action silently does nothing
- ❌ **Unconditional debug traces**: `console.log` calls fire in production browser sessions; they cannot be disabled without a build-time flag
- ❌ **No cancellation for in-flight fetches**: `refresh_now` does not cancel a previous in-flight fetch; rapid interactions can produce out-of-order updates

### Mitigation
- TypeScript's string literal union type for `Actions` catches misspellings at compile time
- The `🎮` prefix makes traces easy to filter out in browser devtools
- The `_update()` diff pruning means a stale fetch response that matches current state produces no re-render

## Related Modules

- **`IUserInterfaceController`** — interface contract: `state`, `settings`, `connect`, `interaction`, `UIEvent` type
- **`AbstractUserInterfaceController`** — abstract base class: `_update`, `_onConnect` hook, `_onInteraction` abstract method, debug traces
- **`ReportController`** — concrete controller: suite tree building, filter/sort, export action
- **`LogViewerController`** — concrete controller: `setInterval` auto-refresh, `/query` fetch, timerange logic
- **`LogViewerController` types** — `LogViewerState`, `LogViewerSettings`, `LogViewerActions`; enumerable auto-refresh and time-range option arrays surfaced via `settings`
