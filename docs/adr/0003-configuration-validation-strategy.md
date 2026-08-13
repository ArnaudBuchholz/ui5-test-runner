# ADR-0003: Configuration Validation Strategy

## Status
Accepted

## Context

The `ui5-test-runner` accepts configuration from multiple sources:

1. **CLI arguments** (highest priority): `--timeout 30000 --parallel 4`
2. **Configuration file**: `ui5-test-runner.json` (default name, overridable with `--config`)
3. **Defaults**: Built-in sensible defaults

Without a clear strategy, configuration handling becomes:
- **Fragile**: Typos in config names aren't caught until runtime
- **Unpredictable**: Unclear which source takes priority
- **Unmaintainable**: Adding new options requires changes in multiple places
- **Unsafe**: Invalid values (negative timeouts, invalid browser names) cause cryptic errors

## Decision

### Option Documentation as the Source of Truth

All configuration options are **defined in documentation first**, stored as Markdown files with YAML frontmatter under `docs/options/`. The source code (`src/configuration/options.ts`, `src/agent/Configuration.ts`, `src/configuration/validations.ts`) is **generated** from these documents — never edited by hand.

Each option file (e.g. `docs/options/parallel.md`) declares:

| Field | Required | Description |
|---|---|---|
| `#type` | **required** | Must be `[[option]]`; files without this value are silently skipped |
| `type` | **required** | Validator type reference (kebab-cased filename from `src/configuration/validators/`); build fails if unknown |
| `summary` | recommended | One-line description used as the CLI help text; omitting it leaves `description` undefined in the generated code |
| `short` | optional | Single-character CLI alias; must be unique across all options |
| `default` | optional | Default value as a string expression (e.g. `"'puppeteer'"`, `2`); omit if the option has no default |
| `typeModifiers` | optional | List of sub-constraints on the type (e.g. narrowing an `fs-entry` to file-only) |
| `browserExposed` | optional | `yes` — forward this option to the in-browser agent (`src/agent/Configuration.ts`) |
| `batchForwarded` | optional | `yes` — forward this option when running in batch mode |
| `multiple` | optional | `yes` — allow the option to be specified more than once on the CLI |
| `validation` | optional | List of cross-field validation rules compiled to `src/configuration/validations.ts`; each rule has `message` and `conditions` |

Option types are themselves documented under `docs/options/types/` (e.g. `integer.md`, `browser.md`). The available types are discovered at build time by listing `src/configuration/validators/`.

#### Code Generation (`build/options.mjs`)

Running `make options` (or `npm run build:options`) executes `build/options.mjs`, which:

1. Reads all `.md` files in `docs/options/` and parses their YAML frontmatter
2. Validates each option (duplicate names/shorts, unknown types)
3. Emits `src/configuration/options.ts` — the `options` array and `defaults` object consumed by `CommandLine.ts`
4. Emits `src/agent/Configuration.ts` — the `Configuration` type for `browserExposed` options used inside the browser agent
5. Emits `src/configuration/validations.ts` — cross-field validation functions compiled from the `validation` frontmatter field

**Adding or modifying an option therefore means editing (or creating) a file in `docs/options/`, then re-running `make options`.** The `add-option` skill encodes this workflow.

---

Implement a **Multi-Stage Configuration Validation Strategy**:

```
┌─────────────────────────────────────────────────┐
│ 1. Collect                                      │
│ - Read CLI args                                 │
│ - Read config file                              │
│ - Apply defaults                                │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│ 2. Parse                                        │
│ - Deserialize from JSON/JS                      │
│ - Type coercion (string to number)              │
│ - Merge sources with priority                   │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│ 3. Validate                                     │
│ - Schema validation (required fields)           │
│ - Type checking (numbers are positive, etc.)    │
│ - Cross-field validation (dependencies)         │
│ - Enum validation (valid browser names)         │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│ 4. Transform                                    │
│ - Normalize paths (resolve relative to CWD)     │
│ - Expand globs                                  │
│ - Compute derived values                        │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│ 5. Result                                       │
│ - Fully validated, typed config object          │
└─────────────────────────────────────────────────┘
```


### Implementation Structure

```
docs/options/
├── <name>.md                (One file per option — YAML frontmatter is the source of truth)
└── types/
    └── <type>.md            (Documentation for each validator type)

build/
└── options.mjs              (Code generator: reads docs/options/, writes the three files below)

src/configuration/
├── options.ts               (GENERATED — option definitions and defaults; do not edit by hand)
├── validations.ts           (GENERATED — cross-field validation functions; do not edit by hand)
├── Configuration.ts         (Configuration type, derived from options)
├── CommandLine.ts           (CLI parsing & entry point: CommandLine.buildConfigurationFrom())
├── ConfigurationValidator.ts (Validation, config file merging, mode computation)
├── Option.ts                (Option type definitions)
├── OptionValidationError.ts (Typed validation error class)
├── indexedOptions.ts        (Options indexed by name, short name, and kebab-case)
└── validators/              (Per-type validators: boolean, browser, fs-entry, integer, ...)

src/agent/
└── Configuration.ts         (GENERATED — Configuration type for browser-exposed options)
```


### Priority Order (highest to lowest)
1. CLI arguments
2. Configuration file
3. Built-in defaults

## Consequences

### Positive
- ✅ **Fail Fast**: Invalid config caught at startup with clear error messages
- ✅ **Type Safety**: Configuration is fully typed and validated
- ✅ **Maintainability**: Adding a new option requires changes in only `docs/options/`
- ✅ **Clarity**: Each stage has a single responsibility
- ✅ **Testability**: Each stage can be tested independently
- ✅ **Flexibility**: New validation rules or transformations are easy to add

### Negative/Trade-offs
- ❌ **Complexity**: Multi-stage approach adds layers of abstraction
- ❌ **Build step required**: Options cannot be added without running `make options`; generated files must be committed alongside their doc sources
- ❌ **Performance**: Validation adds a small startup cost (negligible in practice)

### Mitigation
- Custom per-type validators keep validation logic co-located with type definitions
- Provide clear, actionable error messages via `OptionValidationError`
- All configuration options are documented in `docs/options/` — documentation and implementation stay in sync because the code is generated from the docs
- The `add-option` skill encodes the correct workflow so contributors don't bypass the generator

## Related Files & Modules
- **Option docs**: `docs/options/<name>.md` — one file per option; YAML frontmatter is the source of truth
- **Type docs**: `docs/options/types/<type>.md` — documentation for each validator type
- **Code generator**: `build/options.mjs` — invoked by `make options` / `npm run build:options`
- **Generated files**: `src/configuration/options.ts`, `src/configuration/validations.ts`, `src/agent/Configuration.ts`
- **Entry Point**: `src/configuration/CommandLine.ts` — `CommandLine.buildConfigurationFrom()`
- **CLI Integration**: `src/cli.ts` calls `CommandLine.buildConfigurationFrom()` directly
- **Tests**: `src/configuration/*.spec.ts` — comprehensive validation tests

## Example: Adding a New Option
- Use the skill `add-option` — it encodes the full doc-first workflow