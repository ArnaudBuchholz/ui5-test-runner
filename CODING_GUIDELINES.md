# Coding Guidelines

## Scope

Applies to all implemented modules. Not to tooling config files (`vite.config.ts`, `vitest.config.ts`, `eslint.config.ts`).

---

## Repository layout

```
src/
  agent/          # Browser-side code injected into test pages (QUnit/OPA)
  ai/             # AI generated UIs
  browsers/       # Browser abstraction
  configuration/  # CLI argument parsing, options, validators
  modes/          # Execution modes (test, batch, help, version…)
  platform/       # Node.js abstraction layer (Exit, Process, FileSystem, logger…)
  reports/        # Report generation
  types/          # Shared TypeScript types, interfaces, type utilities
  utils/          # Utilities split by environment: node/, shared/, ui/
```

`agent/` and `ai/` run in a browser context — Node.js-specific rules do not apply there.

---

## File structure

- One concept per file, named after it (`Exit.ts`, `CommandLine.ts`); small related helpers may be grouped (`constants.ts`, `types.ts`)
- Test files co-located: `Exit.ts` → `Exit.spec.ts`; shared test helpers use `.test.ts`
- **Barrel files (`index.ts`)**: only where a stable public API is needed, not for tidiness
- **File size**: max **200 lines** (signal only, not linted) — split when exceeded
- **File naming**: `camelCase` for non-class modules; `PascalCase` for class/factory modules
- **Splitting**: move to a **subfolder** named after the concept; no catch-all helpers (e.g. avoid `fooHelpers.ts`)
- **Exports**: **named exports only**; default exports forbidden in implemented modules

---

## TypeScript

### Strict mode

`tsconfig.base.json` enables `strict: true` with all sub-flags — never disable any.

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

`src/types/typeUtilities.ts` provides `Equal`, `Expect`, `Writable`, `DeepPartial`. Use them; don't reimplement. Inline type-level tests live alongside their utility.

### Type safety

- Prefer `unknown` over `any`
- No type assertions (`as`) in implemented modules — use typeguard functions instead
- Type assertions acceptable in test files

### Interfaces and types

- `interface` for object shapes/contracts; `type` for aliases, unions, intersections, mapped types
- `readonly` on properties that don't change after construction
- Rely on type inference; don't annotate already-inferred types
- Always specify explicit return types on exported and public functions

### Factory functions

Prefer factory functions returning a typed interface for DI. Max **3 parameters** per function — don't pass dependencies as extra parameters.

---

## Design patterns

| Pattern | Description | Example |
|---|---|---|
| Static manager | Static-only class for global lifecycle state, never instantiated | `Exit`, `Thread` |
| Factory | Object with `build` method returning the correct `I`-prefixed implementation | `BrowserFactory` |
| Interface + adapter | Platform implementations hidden behind `I`-prefixed interface | `IBrowser.ts` |
| Builder | Accumulates state then returns result | `AgentTestResultsBuilder` |
| Memoization | `memoize` from `src/utils/shared/` for expensive, side-effect-free computations | |

Do not introduce new module-level singletons.

---

## Platform abstraction (`src/platform/`)

All `node:*` access goes through `src/platform/`. Never import `node:*` directly outside that folder.

`platform/mock.ts` is the centralised Vitest mock — use it via `vi.mock`; never mock `node:*` directly.

---

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

---

## Logger

`console.log/warn/error` forbidden in application code. Import via `'../platform/index.js'`.

| Level | When |
|---|---|
| `debug` | Internal events, metrics, lifecycle noise |
| `info` | Normal user-visible progress |
| `warn` | Unexpected but recoverable |
| `error` | Failure in one operation; execution continues |
| `fatal` | Unrecoverable — program will exit |

Every call requires `source` and `message`. Pass errors in the `error` field — never interpolate into `message`. `logger.error` auto-downgrades to `debug` for `ExitShutdownError`.

---

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

---

## Assertion

Use `assert` from `src/platform/` for internal invariants. Never `console.assert` or bare `throw new Error`.

---

## Comments

No comments by default. Add one only when the **why** is non-obvious.

`eslint-disable` at file or block level is **forbidden**. `eslint-disable-next-line` as last resort — reason must follow `--`:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- No official type for Node.js handle
```

`/* v8 ignore next -- @preserve */` only for genuinely unreachable branches.

---

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

Not required at top level. Nest when tests share setup or are logically grouped. Max **5 levels**.

### Mocking

Prefer DI via factory functions over module-level mocking. Use `vi.mock()` at module level when DI isn't applicable.

---

## Build and linting

```bash
npm run lint        # ESLint + Prettier + tsc + dependency-loop check
npm run test:unit   # Vitest with coverage
```

Both must pass with zero errors before every commit. Circular imports are forbidden. `src/platform/logger/proxy.ts` breaks one unavoidable internal loop — do not replicate. When adding source files, verify they are included in the correct `tsconfig` project.

---

## UI5 Web Components

Use UI5 Web Components over plain HTML for style consistency. Avoid complex or deeply nested component compositions.

---

## Change Scope

Each change has a **single purpose**: **Fix** (correct behavior), **Feature** (new behavior), or **Refactor** (structure only). Never mix purposes in one change.

---

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
