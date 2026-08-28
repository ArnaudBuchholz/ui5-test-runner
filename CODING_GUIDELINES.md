# Coding Guidelines

## Project overview

`ui5-test-runner` is a standalone Node.js CLI that drives browsers to execute UI5 (Fiori/SAPUI5/OpenUI5) test pages and produces CTRF JSON reports.

## Scope

Applies to all implemented modules. Not to tooling config files (`vite.config.ts`, `vitest.config.ts`, `eslint.config.ts`).

## Repository layout

```
src/
  agent/          # Browser-side code injected into test pages (QUnit/OPA)
  browsers/       # Browser abstraction
  configuration/  # CLI argument parsing, options, validators
  modes/          # Execution modes (test, batch, help, version…)
  platform/       # Node.js abstraction layer (Exit, Process, FileSystem, logger…)
  reports/        # Report generation
  types/          # Shared TypeScript types, interfaces, type utilities
  ui/             # Browser UIs
  utils/          # Utilities split by environment: node/, shared/, ui/
```

`agent/` and `ui/` run in a browser context — Node.js-specific rules do not apply there.

### Agent / Runner boundary

The agent runs in the browser and has direct access to `QUnit.config`, `window.sap`, and the URL; the runner has none of that. Rules:

- Decisions that depend on browser-side state must be made in the agent, not threaded through `AgentState` to the runner.
- Before designing new agent→runner communication, read `AgentState` and `pageTask.ts` — an existing state type may already express the intent.
- When agent behaviour must be conditional on a runner option, mark it `browserExposed: yes` in its doc file; this seeds `window['ui5-test-runner'].config` automatically.

## Execution pipeline

`src/cli.ts` → `CommandLine` parses args → `ConfigurationValidator` validates and resolves the mode → `modes/execute.ts` dispatches to a mode function → mode uses browsers, platform, reports.

## File structure

- One concept per file, named after it; small related helpers may be grouped (`constants.ts`, `types.ts`)
- Test files co-located: `Exit.ts` → `Exit.spec.ts`; shared test helpers use `.test.ts`
- **Barrel files (`index.ts`)**: only where a stable public API is needed, not for tidiness
- **File size**: max **200 lines** (signal only) — split when exceeded
- **File naming**: `camelCase` for non-class modules; `PascalCase` for class/factory modules
- **Splitting**: move to a subfolder named after the concept; no catch-all helpers (avoid `fooHelpers.ts`)
- **Exports**: named exports only; default exports forbidden in implemented modules

## TypeScript

### Strict mode

`tsconfig.base.json` enables `strict: true` — never disable any sub-flag.

### Naming

| Concept | Convention | Example |
|---|---|---|
| Class | PascalCase | `ConfigurationValidator` |
| Interface | `I` + PascalCase | `IBrowser`, `IAsyncTask` |
| Type alias | PascalCase | `OptionType`, `BrowserSettings` |
| Function / variable | camelCase | `registerAsyncTask`, `memoize` |
| Private class field | `_` prefix | `_asyncTasks`, `_configuration` |
| Constant / enum-like | PascalCase `as const` | `Modes`, `LogLevel` |

### `as const` — enums are forbidden

```typescript
export const Modes = { batch: 'batch', help: 'help' } as const;
export type Mode = (typeof Modes)[keyof typeof Modes];
```

### Type utilities

`src/types/typeUtilities.ts` provides `Equal`, `Expect`, `Writable`, `DeepPartial`. Use them; don't reimplement.

### Type safety

- Prefer `unknown` over `any`
- No type assertions (`as`) in implemented modules — use typeguard functions instead
- Type assertions acceptable in test files; prefer `as T` over `as unknown as T` unless TypeScript rejects the direct cast

### Interfaces and types

- `interface` for object shapes/contracts; `type` for aliases, unions, intersections, mapped types
- `readonly` on properties that don't change after construction
- Rely on type inference; don't annotate already-inferred types
- Always specify explicit return types on exported and public functions

### Factory functions

Prefer factory functions returning a typed interface for DI. Max **3 parameters** — don't pass dependencies as extra parameters.

## Design patterns

| Pattern | Description | Example |
|---|---|---|
| Static manager | Static-only class for global lifecycle state, never instantiated | `Exit`, `Thread` |
| Factory | Object with `build` method returning the correct `I`-prefixed implementation | `BrowserFactory` |
| Interface + adapter | Platform implementations hidden behind `I`-prefixed interface | `IBrowser.ts` |
| Builder | Accumulates state then returns result | `AgentTestResultsBuilder` |
| Memoization | `memoize` from `src/utils/shared/` for expensive, side-effect-free computations | |

Do not introduce new module-level singletons.

## UI Controller pattern

Strict MVC split:

- **Controller** (`src/reports/ui/ReportController.ts`): holds all state and logic, exposes `IUserInterfaceController<Settings, State, Actions>`.
- **View** (`src/ui/report/`): wires DOM ↔ controller. No business logic. Calls `controller.connect(update)` on load; uses `controller.interaction({ changedField })` for user events; applies `update(changed)` patches only for present fields.


## Platform abstraction (`src/platform/`)

All `node:*` access goes through `src/platform/`. Never import `node:*` directly outside that folder. `platform/mock.ts` is the centralised Vitest mock — use it via `vi.mock`; never mock `node:*` directly.

## Graceful shutdown — `Exit` and `IAsyncTask`

Every long-running resource must be registered with `Exit`:

```typescript
using _server = Exit.registerAsyncTask({
  name: 'http-server',
  stop: () => server.close()  // must be idempotent
});
```

- Every resource with a cleanup step must be registered — no exceptions
- `stop` must be idempotent
- `registerAsyncTask` throws `ExitShutdownError` if shutdown has started — treat as abort signal
- Tasks stop in LIFO order
- Never call `process.exit()` — use `Exit.shutdown()`

## Logger

`console.log/warn/error` forbidden. Import via `'../platform/index.js'`.

| Level | When |
|---|---|
| `debug` | Internal events, metrics, lifecycle noise |
| `info` | Normal user-visible progress |
| `warn` | Unexpected but recoverable |
| `error` | Failure in one operation; execution continues |
| `fatal` | Unrecoverable — program will exit |

Every call requires `source` and `message`. Pass errors in the `error` field — never interpolate into `message`. `logger.error` auto-downgrades to `debug` for `ExitShutdownError`.

## Configuration system (`src/configuration/`)

| File | Role |
|---|---|
| `options.ts` | All CLI options — **generated, never edit by hand** |
| `indexedOptions.ts` | Indexed lookup by name / short flag |
| `Option.ts` | `Option<T>`, `OptionType`, `InferOptionType<T>` |
| `CommandLine.ts` | Parses raw CLI args (no validation logic here) |
| `ConfigurationValidator.ts` | Validates, merges defaults, resolves mode |
| `Configuration.ts` | Fully-typed `Configuration` object |
| `validators/` | One file per `OptionType` |

To add/change an option: edit `docs/options/` → `npm run build:options` → add validator if new type.

## Assertion

Use `assert` from `src/platform/` for internal invariants. Never `console.assert` or bare `throw new Error`.

## Comments

No comments by default. Add one only when the **why** is non-obvious.

`eslint-disable` at file or block level is **forbidden**. `eslint-disable-next-line` as last resort — reason must follow `--`:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- No official type for Node.js handle
```

`/* v8 ignore next -- @preserve */` only for genuinely unreachable branches.

## Testing

Framework: Vitest. `Foo.spec.ts` co-located with source; `Foo.test.ts` for shared helpers.

- Only **logic** is unit tested; UI rendering is not tested
- Tests must be small and fast with a **single clear expectation** — split if more needed
- Cover happy path and all edge cases; **coverage: 100 %**
- Mock via `vi.mock(import('../platform/mock.js'))` — never mock `node:*` directly
- Validator tests use `checkValidator` from `src/configuration/validators/checkValidator.test.ts`

### Test naming — affirmative style

```typescript
it('returns the filtered list when status is failed')
it('throws when the input is missing')
```

### `describe` nesting

Not required at top level. Nest when tests share setup or are logically grouped. Max **5 levels**. Scope `beforeEach` inside the relevant `describe` rather than repeating setup in every test.

### Mocking

- Prefer DI via factory functions over module-level mocking. Use `vi.mock()` at module level when DI isn't applicable.
- `src/platform/mock.ts` mocks all platform exports as `vi.fn()`. Never add `vi.spyOn()` in spec files for platform modules.
- Setup: `vi.mocked(method).mockResolvedValue(...)`. Assertions: `expect(method).toHaveBeenCalledWith(...)` — no `vi.mocked()` wrapper in `expect`.
- For non-platform static methods, use `vi.spyOn(Class, 'method')` rather than a full `vi.mock()` of the module.
- Stub spawned processes as `IProcess` (from `platform/index.js`), not `InstanceType<typeof Process>`.

### Asserting no-op paths

Set a sentinel value before calling and assert it is unchanged. Use a value that cannot pass accidentally (`999` for an exit code, not `0`). Assert `Exit.code` directly — never `process.exitCode`.

### Controllable promises

Use `Promise.withResolvers()` — not a manually-captured resolver variable.

### Named constants for repeated values

Extract any repeated or cast value into a `UPPER_SNAKE_CASE` constant at the top of the file:

```typescript
const NO_CONFIGURATION = {} as Configuration;
Npm.import(NO_CONFIGURATION, 'node:path')
```

## Commands

```bash
npm run lint              # ESLint + Prettier + tsc --noEmit + circular import check
npm run test:unit         # Vitest with coverage
npm run test:unit:watch   # Vitest watch mode
npx vitest run src/path/to/Foo.spec.ts

npm run build:agent       # Bundles src/agent/
npm run build:ui:report   # → dist/ui5-test-runner-html-report.js
npm run build:ui:log      # → dist/ui5-test-runner-log-viewer.js
npm run start:ui:report   # Vite dev server for HTML report viewer
npm run start:ui:log      # Vite dev server for log viewer
npm run build:options     # Regenerate options.ts from docs/options/
npm run ts-run -- src/cli.ts [args]  # Run CLI directly (no pre-build)
```

`npm run lint` must pass with zero errors before every commit. Circular imports are forbidden. `src/platform/logger/proxy.ts` breaks one unavoidable internal loop — do not replicate. Verify new source files are included in the correct `tsconfig` project.

## UI5 Web Components

Use UI5 Web Components over plain HTML for style consistency. Avoid complex or deeply nested component compositions.

## Change Scope

Each change has a **single purpose**: **Fix** (correct behavior), **Feature** (new behavior), or **Refactor** (structure only). Never mix purposes in one change.

## Implementation discipline

- **"Implemented" ≠ "enforced"**: an option being parsed, validated, and forwarded is not the same as being acted on. Grep for the option name in non-config, non-test `src/` files to verify it actually changes behaviour.
- **Prefer existing shared state**: before adding a new variable, check whether an already-initialised shared object holds what you need.
- **Factorize shared logic**: if writing a second function that is identical to the first except for one parameter, extract a private core and expose named wrappers.
- **Default parameters over `?? 0` at call sites**: for numeric helpers that treat `undefined` as zero, put the default in the function signature.

## Anti-patterns

| Anti-pattern | Preferred alternative |
|---|---|
| Circular imports | Restructure or introduce an abstraction |
| `node:*` outside `src/platform/` | Import through `src/platform/` |
| Module-level singleton | Static manager class or DI |
| `throw new Error` for invariants | `assert(condition, message)` |
| Depending on concrete class | Depend on `I`-prefixed interface |
| `any` without justified `eslint-disable` | Narrow or use `unknown` |
| `enum` | `as const` + derived union type |
| Parsing logic in `CommandLine.ts` | Validator in `configuration/validators/` |
| Global variable for shared state | `Exit.registerAsyncTask` |

## Dependencies

Production dependencies must meet **both** criteria:

- **Zero transitive dependencies**
- **MIT licensed**

Prefer implementing functionality inline over adding a dependency that doesn't qualify. `devDependencies` are not subject to these constraints.
