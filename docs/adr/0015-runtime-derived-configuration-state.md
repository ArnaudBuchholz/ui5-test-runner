# ADR-0015: Runtime-Derived Configuration State

## Status
Accepted

## Context

`Configuration` is predominantly generated from the options table (`src/configuration/options.ts`): every CLI flag / config-file key becomes a top-level property, typed and defaulted from its doc entry (see [ADR-0003](./0003-configuration-validation-strategy.md)). A small number of top-level properties are **not** options — `mode` and `sources` — but they are still computed once, at configuration-validation time, before any test executes.

The per-page coverage `only`/`never` feature introduced a genuinely new kind of field: a flag computed **during execution**. When a testsuite declares `addTestPage(url, { coverage: { only, never } })`, the runner only discovers it mid-run (in `pageTask`, after the suite agent reports its pages), and must record "the nyc baseline is now invalid, drop it before reporting" so a later phase (`index.ts`, before `generateReport`) can act on it. See [ADR-0009](./0009-coverage-architecture.md) for the surrounding coverage flow.

Placing this flag flat on `Configuration` (e.g. `configuration.coverageBaselineInvalidated`) works, but has two problems:

1. **Namespace collision risk.** The flat namespace is shared with option names. A future option named `coverageBaselineInvalidated` (or any other runtime flag's name) would silently collide with a runtime field — same property, two meanings, no compiler warning because both are generated/declared into the same object type.
2. **No lifecycle signal.** A reader cannot distinguish "value the user supplied / derived at startup" from "value mutated while tests were running." The three tiers (option-derived, startup-derived, execution-derived) all looked identical.

## Decision

### A dedicated `runtime` sub-object for execution-derived state

`Configuration` carries a single nested object for all state computed **during execution**:

```ts
export type Configuration = { /* …options… */ } & {
  mode: Modes;
  sources: { [key in string]?: 'cli' | 'config' };
  /** State computed during execution (not from CLI/config, not an option). */
  runtime: {
    /** A testsuite declared per-page coverage only/never, so the nyc baseline must be dropped before reporting. */
    coverageBaselineInvalidated?: true;
  };
};
```

Access is `configuration.runtime.coverageBaselineInvalidated`.

### Why nested, not flat

- **No conflict with option names, by construction.** Options are generated as top-level keys; `runtime` is a single reserved top-level key holding its own namespace. A member of `runtime` can never collide with an option, and an option can never be named into `runtime`'s members. The one name to keep clear of the options table is `runtime` itself.
- **Lifecycle is explicit.** `runtime.*` reads as "populated while the run is in progress" at every call site, distinct from option-derived and startup-derived (`mode`/`sources`) fields.

### `runtime` is required and initialized once; members are optional

`runtime` is a **required** object (`runtime: { … }`, not `runtime?:`), initialized to `{}` during configuration validation (`ConfigurationValidator`, alongside `sources`). Its **members** are optional. This means:

- Writers assign a member directly — `configuration.runtime.coverageBaselineInvalidated = true` — with no null-guard on `runtime`.
- Readers test the member — `if (configuration.runtime.coverageBaselineInvalidated)` — never the container.
- A member typed `?: true` (rather than `?: boolean`) models a set-once latch: present-and-`true`, or absent. There is no meaningful `false`.

### One initializer for the non-option structural members

The non-option members form a named type, `ConfigurationStructuralMembers` (`mode`, `sources`, `runtime`), and `Configuration.ts` exports `createConfigurationStructuralMembers()` returning them with their empty/default values:

```ts
export const createConfigurationStructuralMembers = (): ConfigurationStructuralMembers =>
  ({ mode: Modes.help, sources: {}, runtime: {} });
```

`mode` defaults to `Modes.help`. The validator always overrides it via `computeMode` before any consumer reads it, so the default is never observed on the real path — it exists only so constructions that skip full validation (unit fixtures) get a complete, valid shape. Both the validator and test fixtures spread this one factory rather than hand-listing the members; when a new structural member is added to the type, it flows into every construction site through the factory, and the compiler flags any site that still builds the shape by hand.

### Scope

`runtime` holds **only** state derived during execution. Values known at parse time stay options; values computed once at startup (`mode`, `sources`) stay where they are — this ADR does not relocate them. A field belongs in `runtime` when it is written *after* test execution begins.

## Consequences

- New execution-derived flags go under `runtime` with an optional member and a doc comment; no new top-level key, no risk of shadowing an option.
- `runtime` must be initialized before the first write. The validator seeds it via `createConfigurationStructuralMembers()` so every validated configuration has it; code constructing a `Configuration` outside that path (e.g. unit tests) spreads the same factory.
- `runtime` is a reserved name: no option may be named `runtime`.
- Redaction/serialization of `Configuration` (e.g. trace logging) now includes the `runtime` sub-object — it carries no secrets, but tooling that enumerates config keys should expect a nested object there.

## Rejected Alternatives

- **Flat top-level flag** (`configuration.coverageBaselineInvalidated`): shares the option namespace, risking a silent collision with a future option of the same name, and gives no lifecycle signal. This is what the ADR replaces.
- **Names `live` / `dynamic` / `state`**: `live`/`dynamic` imply reactivity or recomputation, which this is not. `state` collides conceptually with the browser-side `AgentState`. `runtime` plainly means "populated at run time."
- **A separate companion object threaded alongside `configuration`** (`RunState` passed through `index.ts` → `makePageTask` → `PageContext` → `pageTask`): cleanest separation, but it threads a second parameter through the whole execution path for what is, today, a single boolean. Revisit if execution-derived state grows into a cluster with its own logic; until then, a sub-object on the already-threaded `Configuration` is proportionate.
