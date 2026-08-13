# ADR-0003: Configuration Validation Strategy

## Status
Accepted

## Context

The ui5-test-runner accepts configuration from multiple sources:

1. **CLI arguments** (highest priority): `--timeout 30000 --parallel 4`
2. **Configuration file**: `ui5-test-runner.config.js` or `.ui5-test-runner.json`
3. **Environment variables**: `UI5_RUNNER_TIMEOUT=30000`
4. **Defaults**: Built-in sensible defaults

Without a clear strategy, configuration handling becomes:
- **Fragile**: Typos in config names aren't caught until runtime
- **Unpredictable**: Unclear which source takes priority
- **Unmaintainable**: Adding new options requires changes in multiple places
- **Unsafe**: Invalid values (negative timeouts, invalid browser names) cause cryptic errors

## Decision

Implement a **Multi-Stage Configuration Validation Strategy**:

```
┌─────────────────────────────────────────────────┐
│ 1. Collect                                      │
│ - Read CLI args                                 │
│ - Read config file                              │
│ - Read env vars                                 │
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
src/configuration/
├── types.ts           (IConfigOptions interface)
├── defaults.ts        (Default values)
├── schema.ts          (Validation schema/rules)
├── parser.ts          (Parsing & merging)
├── validator.ts       (Validation logic)
├── transformer.ts     (Normalization & transformation)
└── index.ts           (Facade: loadConfiguration())
```


### Priority Order (highest to lowest)
1. CLI arguments
2. Environment variables
3. Configuration file
4. Built-in defaults

## Consequences

### Positive
✅ **Fail Fast**: Invalid config caught at startup with clear error messages
✅ **Type Safety**: Configuration is fully typed and validated
✅ **Maintainability**: Adding a new option requires changes in only `configuration/` module
✅ **Clarity**: Each stage has a single responsibility
✅ **Testability**: Each stage can be tested independently
✅ **Flexibility**: New validation rules or transformations are easy to add

### Negative/Trade-offs
❌ **Verbosity**: Defining schema requires code in multiple places
❌ **Complexity**: Multi-stage approach adds layers of abstraction
❌ **Performance**: Validation adds a small startup cost (negligible in practice)

### Mitigation
- Use a schema library (e.g., Zod, Joi) to reduce boilerplate
- Provide clear, actionable error messages
- Document all configuration options in one place
- Consider generating docs from schema

## Related Files & Modules
- **Entry Point**: `src/configuration/index.ts` - loadConfiguration()
- **CLI Parsing**: Integration with `src/cli.ts`
- **Usage**: All modules that need config should receive it as constructor dependency
- **Tests**: `src/configuration/*.spec.ts` - comprehensive validation tests

## Example: Adding a New Option
- Use the skill `add-option`