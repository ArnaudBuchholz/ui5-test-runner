# UI Controller Guidelines

## Overview

You will implement the view and bindings only. Do not reimplement business logic, validation, or state mutation. Use the provided controller API exactly as documented. Assume the controller is fully tested and correct.

## Implementation structure

The code of this report resides in `{{output_path}}`, it must use:

* TypeScript
* Vanilla JavaScript (no framework)
* [UI5 Web Components](https://ui5.github.io/webcomponents/), use only `@ui5/webcomponents`.
* `vite` for bundling
* `vitest` for testing

Follow the `CODING_GUIDELINES.md`:

* Do not put everything in the `main.ts` file, split the implementation into manageable chunks which are unit tested
* Only the logic should be tested

The build output should go in `{{dist_name}}` in a single self-contained and minified JavaScript file (it must pack everything including css).

The application should be locally runnable to do manual testing. Create an `test.html` entry point for vite inside the implementation folder.

## Target browsers

Only modern browsers will be used, ignore Internet Explorer compatibility.

## UI5 guidelines

### Component mapping

Every interactive control must use the specific UI5 Web Component listed below. Plain `<input>`, `<select>`, or `<button>` elements are not acceptable in place of their UI5 equivalents.

| Purpose | Component | Import |
|---------|-----------|--------|
| Label | `<ui5-label>` | `@ui5/webcomponents/dist/Label.js` |
| Filter text field | `<ui5-input>` | `@ui5/webcomponents/dist/Input.js` |
| Drop downs | `<ui5-select>` + `<ui5-option>` | `@ui5/webcomponents/dist/Select.js` |
| Date-time picker | `<ui5-datetime-picker>` | `@ui5/webcomponents/dist/DateTimePicker.js` |
| Refresh / action buttons | `<ui5-button>` | `@ui5/webcomponents/dist/Button.js` |
| Error message | `<ui5-message-strip design="Negative">` | `@ui5/webcomponents/dist/MessageStrip.js` |
| Popup | `<ui5-popover>` | `@ui5/webcomponents/dist/Popover.js` |
| Popup close button | `<ui5-button design="Transparent">` | `@ui5/webcomponents/dist/Button.js` |
| Panel | `<ui5-panel>` | `@ui5/webcomponents/dist/Panel.js` |
| Breadcrumbs | `<ui5-breadcrumbs>` + `<ui5-breadcrumbs-item>` | `@ui5/webcomponents/dist/Breadcrumbs.js` + `@ui5/webcomponents/dist/BreadcrumbsItem.js` |

`<ui5-datetime-picker>` emits a `change` event; read the selected value from `event.detail.value` (a formatted string) or `event.target.dateValue` (a `Date` object). Convert to epoch with `.getTime()`.

### Popovers

#### Placement

`<ui5-popover>` elements must **not** be injected into `#app` via `innerHTML` — placing them as flex siblings of the header or toolbar breaks the layout. They must be inserted **once, before `#app`**, and never re-rendered or replaced. The preferred approach is to inject them programmatically from `main.ts` on `DOMContentLoaded` using `app.insertAdjacentHTML('beforebegin', ...)`, keeping the HTML shell minimal and the viewer self-contained. Update their inner content via `popover.innerHTML = ...` when state changes.

#### Opener

Pass the clicked element directly as the `opener`. For listeners attached directly to a button, use `event.currentTarget`. For delegated listeners (e.g. a single listener on `<thead>` handling clicks on any `<th>`), `event.currentTarget` points to the delegate container, not the clicked cell — in that case resolve the actual target first (e.g. via `closest`) and pass that element as the opener:

```typescript
// Direct listener — use event.currentTarget
button.addEventListener('click', (event) => {
  popover.opener = event.currentTarget;
  popover.open = true;
});

// Delegated listener — resolve the actual target first
container.addEventListener('click', (event) => {
  const cell = (event.target as Element).closest('th[data-col]');
  if (!cell) return;
  popover.opener = cell;
  popover.open = true;
});
```

### Panels

```
┌───────────────────────────────────────────────────────────────────────┐
│ [V] Summary                                              ((- failed)) │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │  
```

Translates to:

```css
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}
```

```html
<ui5-panel no-animation="true">
  <div slot="header" class="header">
    <ui5-title>Test Report</ui5-title>
    <ui5-tag design="Negative">failed</ui5-tag>
  </div>
</ui5-panel>
```

## Provided artefacts

* Controller object: controller implements `IUserInterfaceController<Settings, State, Actions>` (signature below).
* DOM skeleton: list of element selectors and their intended role (see **Element bindings**).
* Minimal CSS and HTML already present; you may add classes/attributes but not change controller code.
* A small test harness with event spies (optional): `spy.called(name)` etc.

## Controller API (use exact behavior)

See definition in `src/types/IUserInterfaceController.ts`

Behavioral rules:

* Must call `connect(...)` first.
* Use `state` and `settings` to render UI.
* The `update(...)` callback is called only if the controller needs to correct/reject/change UI (after applying normalization/validation). Treat `update(...)` as authoritative: apply any changes it sends.
* When the UI calls `controller.interaction(...)`, assume optimistic success; do not wait for a confirmation unless controller calls `update(...)`.
* Always send only changed fields in the `UIEvent` payload.
* Do not call internal controller methods or mutate controller state directly.

## UX behaviors

* On text input change: debounce 250ms before calling `controller.interaction`
* In a text field, when pressing Enter: trigger `controller.interaction` immediately
* If the text field directly relates to a button (for instance: a field changing the filtering results and a filter button), pressing Enter should then also trigger the associated action.
* root container listens to controller update(...) to refresh only fields present in the changed object.

##  Rendering rules

* Render only what changed: when `update(changed)` is called, patch DOM fields that exist in changed.
* For list updates (state.items):
  * Replace list contents with controller-provided snapshot (prefer controller.connect().initialState.items or update payload). Do not re-fetch or re-filter in view.
  * Use stable keys (item.key) for element attributes.
* For inputs bound to controller properties:
  * Do not programmatically set the input value unless the controller called update(...) with that property.
  * If user input conflicts with an incoming update correction, follow controller update — replace the input value.
* Accessibility: ensure labels and ARIA attributes are preserved.

## Events & timing

* Debounce user typing as specified in Element bindings.
* Avoid race conditions: when an input triggers interaction and the controller later calls update(...), apply the update regardless of in-progress UI events.
* If multiple fields change together, controller will send them in one update call.

## Minimal integration tests the LLM must make pass

* On load: call `controller.connect(update)` and render `state` and `settings`.
* Typing in input#filter: after 250ms debounce, controller.interaction called exactly once with { filter: VALUE }.
* Controller calls update({ filter: NORMALIZED_VALUE }): UI updates input#filter to NORMALIZED_VALUE.
* Changing select#category immediately calls controller.interaction with { category: KEY } and no extra fields.
* Controller sends update({ items: [...] }) → ul#items reflects the exact items array (label + data-key).
* Clicking button.apply triggers controller.interaction({ action: 'apply' }).

## Failure modes to avoid (concise)

* Never duplicate controller logic in view (validation, filtering, pagination).
* Do not assume asynchronous behavior order; always apply controller.update corrections.
* Do not mutate objects received from controller; clone if modifying.

## Deliverables (what to return)

* Fully working TS file that wires DOM → controller and controller → DOM per above rules.
* A short list of assumptions you made (max 3).
* Minimal test log showing the 6 integration tests above pass (or instructions to run them with provided harness).
