---
"#type": concept
title: "Option naming conventions (READ FIRST before answering any option or migration question)"
summary: "READ THIS FIRST before dealing with options: every option has two name surfaces — a CLI flag (kebab-case, e.g. --report-generator) and a configuration-file key (camelCase, e.g. reportGenerator) — that are the same option; explains how to translate between them and how to tell whether an option was removed between v5 and v6."
keywords:
  - options
  - naming
  - conventions
  - cli
  - flag
  - configuration
  - config
  - camelCase
  - kebab-case
  - reportGenerator
  - report-generator
  - migration
  - removed
  - breaking
relations:
  see-also:
    - options
    - v5_options
---

# Option naming conventions

**Read this before answering any question about an option, a configuration file, or a migration.** Every ui5-test-runner option exists under **two name surfaces**, and they refer to the *same* option:

| Surface | Casing | Example |
|---|---|---|
| **CLI flag** | kebab-case, prefixed with `--`, sometimes a short alias | `--report-generator`, short `-rg` |
| **Configuration file key** | camelCase, a key in `ui5-test-runner.json` | `reportGenerator` |

The two spellings are mechanically related: **the configuration key is the CLI flag with the leading `--` removed and each `-x` turned into an uppercase letter.** So `--report-generator` ⇄ `reportGenerator`, `--coverage` ⇄ `coverage`, `--coverage-report-dir` ⇄ `coverageReportDir`.

## How to look up an option

An option documented under one surface is the same option under the other. The documentation reference tables list the **CLI flag** spelling. Therefore:

- When a question or a `ui5-test-runner.json` file mentions a **camelCase key** (e.g. `reportGenerator`), **translate it to its CLI flag spelling** (`--report-generator`) before searching the documentation. Do not conclude an option is unknown just because the camelCase key does not appear verbatim.
- When a question mentions a **CLI flag**, it maps to the camelCase key of the same name in a configuration file.

## Deciding whether an option was removed (v5 → v6)

Not finding a name in the current (v6) reference is a **signal to keep looking, not a dead end**:

1. Translate the key to its CLI-flag spelling.
2. Look for it in the current options reference ([options](./options.md), the v6 set).
3. If it is **absent from the v6 reference but present in the v5 reference** ([Command line usage](./v5_options.md)), the option was **removed in v6** — this is a **breaking change**, and migrating off it is required.
4. If it is **present in the v6 reference**, the option still exists and a command or configuration using it is **compatible with v6 and does not require migration**.

### Worked example

A `ui5-test-runner.json` contains `"reportGenerator": [...]`. Translate to `--report-generator`. It appears in the v5 reference but not in the v6 reference. Conclusion: `reportGenerator` is **no longer supported in v6** and must be removed as part of the migration.

By contrast, a `package.json` script running `ui5-test-runner --coverage` uses `--coverage`, which is present in the v6 reference. Conclusion: that command is **already v6-compatible and needs no migration**.
