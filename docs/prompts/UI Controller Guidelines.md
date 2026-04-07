# UI Controller Guidelines

Goal: implement only the view + bindings to an existing controller. The controller contains state, validation, and business logic; the LLM must wire DOM → controller and controller → DOM only.

## Short instruction

You will implement the view and bindings only. Do not reimplement business logic, validation, or state mutation. Use the provided controller API exactly as documented. Assume the controller is fully tested and correct.

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

## Element bindings (example mapping — change to match your app)

* input#filter → controller.filter (string)
* On input: debounce 250ms, call controller.interaction({ filter: NEW_VALUE })
* On Enter: immediately send controller.interaction({ filter: NEW_VALUE, action: 'submit' })
* select#category → selection list supplied in settings.categories; on change: controller.interaction({ category: SELECTED_KEY })
* ul#items → render items from state.items (array). Each item element must include data-key attribute = item.key.
* button.apply → on click: controller.interaction({ action: 'apply' })
* root container listens to controller update(...) to refresh only fields present in the changed object.
(If the app differs, replace mapping entries accordingly)

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
