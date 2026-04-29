# Coding Guidelines

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

`agent/` and `ai/` run in a browser context — Node.js-specific rules (platform APIs, `Exit`, etc.) do not apply there.

---

## File structure

Major classes live in their own file named after the concept (`Exit.ts`, `CommandLine.ts`). Small, closely related helpers may be grouped (`constants.ts`, `types.ts`).

Test files are co-located: `Exit.ts` → `Exit.spec.ts` (or `Exit.test.ts` for shared test helpers).

**Barrel files (`index.ts`)** exist only where a stable public API is needed (e.g. `src/platform/`). Do not add one just for tidiness.

---

## TypeScript

### Strict mode

`tsconfig.base.json` enables `strict: true` with all sub-flags. Never disable any of them.

### Naming

| Concept | Convention | Example |
|---|---|---|
| Class | PascalCase | `ConfigurationValidator` |
| Interface | `I` + PascalCase — always | `IBrowser`, `IAsyncTask` |
| Type alias | PascalCase | `OptionType`, `BrowserSettings` |
| Function / variable | camelCase | `registerAsyncTask`, `memoize` |
| Private class field | `_` prefix | `_asyncTasks`, `_configuration` |
| Constant / enum-like | PascalCase `as const` | `Modes`, `LogLevel` |

### `as const` — enums are forbidden

TypeScript `enum` is forbidden. Use `as const` + a derived union type:

```typescript
export const Modes = { batch: 'batch', help: 'help' } as const;
export type Mode = (typeof Modes)[keyof typeof Modes];
```

### Type utilities

`src/types/typeUtilities.ts` provides `Equal`, `Expect`, `Writable`, `DeepPartial`. Use them rather than reimplementing. Inline type-level tests (`Expect<Equal<…>>`) live in the same file as the utility they test.

---

## Design patterns

### Static manager

Classes with only static members manage global lifecycle state and are never instantiated (`Exit`, `Thread`). Do not introduce new module-level singletons — use this pattern instead.

### Factory

A plain object with a `build` method returns the correct `I`-prefixed implementation for a given key. See `BrowserFactory`.

### Interface + adapter

Platform-specific implementations are hidden behind an `I`-prefixed interface in its own file (`IBrowser.ts`). Callers always depend on the interface, never the concrete class.

### Builder

Accumulates state across calls then returns a result object. See `AgentTestResultsBuilder`.

### Memoization

Use `memoize` from `src/utils/shared/` for expensive, side-effect-free one-time computations.

---

## Platform abstraction (`src/platform/`)

All Node.js platform access goes through `src/platform/`. Never import from `node:*` directly in application code outside that folder.

`platform/mock.ts` is the centralised Vitest mock for the platform layer. Tests above the platform level must use it via `vi.mock` — never mock `node:*` directly.

---

## Graceful shutdown — `Exit` and `IAsyncTask`

The program must stop cleanly at any time (including Ctrl+C). Every long-running resource (server, browser, worker, file handle…) must be registered with `Exit`:

```typescript
using _server = Exit.registerAsyncTask({
  name: 'http-server',        // shown in shutdown logs — be descriptive
  stop: () => server.close()  // may return a Promise; must be idempotent
});
// automatically unregistered when this scope exits
```

Rules:
- Every resource with a cleanup step must be registered — no exceptions.
- `stop` must be idempotent.
- `registerAsyncTask` throws `ExitShutdownError` if shutdown has already started — treat it as an abort signal, not an error.
- Tasks stop in reverse registration order (LIFO).
- Never call `process.exit()` — use `Exit.shutdown()` or let the SIGINT handler do it.

---

## Logger

Every observable event must go through the logger. `console.log/warn/error` are forbidden in application code.

```typescript
import { logger } from '../platform/index.js';
```

| Level | When to use |
|---|---|
| `debug` | Internal events, metrics, lifecycle noise |
| `info` | Normal progress visible to the user |
| `warn` | Unexpected but recoverable |
| `error` | Failure in one operation; execution continues |
| `fatal` | Unrecoverable — program will exit |

Every call requires `source` and `message`. Pass errors in the `error` field — never interpolate them into `message`. `logger.error` auto-downgrades to `debug` when `error instanceof ExitShutdownError`.

---

## Configuration system (`src/configuration/`)

| File | Role |
|---|---|
| `options.ts` | Master list of all CLI options — **generated, never edit by hand** |
| `indexedOptions.ts` | Indexed lookup by name / short flag |
| `Option.ts` | `Option<T>` type, `OptionType` union, `InferOptionType<T>` |
| `CommandLine.ts` | Parses raw CLI args into an unvalidated configuration |
| `ConfigurationValidator.ts` | Validates, merges defaults, resolves execution mode |
| `Configuration.ts` | The fully-typed `Configuration` object |
| `validators/` | One file per `OptionType` — pure validation functions |

`options.ts` is generated from `docs/options/`. To add or change an option:
1. Edit `docs/options/` and run `npm run build:options`.
2. If the type is new, add a validator in `validators/` and a new entry in `OptionType`.
3. Never add parsing logic in `CommandLine.ts` — validators handle it.

---

## Assertion

Use `assert` from `src/platform/` for internal invariants — it logs before throwing. Never use `console.assert` or bare `throw new Error`.

---

## Comments

Write no comments by default. Add one only when the **why** is non-obvious:

```typescript
// One MessagePort is expected to remain because of the BroadcastChannel
```

`eslint-disable` is a last resort. When unavoidable, the reason must follow `--`:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- No official type for Node.js handle
```

Use `/* v8 ignore next -- @preserve */` only for genuinely unreachable branches (e.g. environment guards).

---

## Testing

**Framework:** Vitest. **File naming:** `Foo.spec.ts` co-located with source; `Foo.test.ts` for shared test helpers.

Mock the platform layer via `vi.mock(import('../platform/mock.js'))` — never mock `node:*` directly.

Validator tests use the `checkValidator` helper from `src/configuration/validators/checkValidator.test.ts`.

**Coverage:** 100 %. Cover the happy path, all error cases, and every identified edge case.

---

## Build and linting

```bash
npm run lint        # ESLint + Prettier + tsc + dependency-loop check
npm run test:unit   # Vitest with coverage
```

Both must pass with zero errors before every commit.

Circular imports are forbidden — `npm run lint` will catch them. `src/platform/logger/proxy.ts` exists to break one unavoidable loop inside the platform layer; do not replicate that pattern.

Linting rules must not be disabled unless there is a genuinely compelling reason. The reason must appear in the disable comment — see [Comments](#comments).

Multiple `tsconfig` project files target different build outputs. When adding source files, verify they are included in the appropriate project.

---

## Anti-patterns

| Anti-pattern | Preferred alternative |
|---|---|
| Circular imports | Restructure or introduce an abstraction |
| `node:*` import outside `src/platform/` | Import through `src/platform/` |
| Module-level singleton | Static manager class or dependency injection |
| `throw new Error` for invariants | `assert(condition, message)` |
| Depending on a concrete class | Depend on the `I`-prefixed interface |
| `any` without a justified `eslint-disable` | Narrow the type or use `unknown` |
| `enum` | `as const` object + derived union type |
| Parsing logic in `CommandLine.ts` | Validator in `configuration/validators/` |
| Global variable for shared state | `Exit.registerAsyncTask` |
