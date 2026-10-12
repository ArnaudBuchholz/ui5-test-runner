---
"#type": option
title: coverageSettings
type: fs-entry
short: cs
typeModifiers:
  - file
  - safe-default
summary: path to the Istanbul configuration file (.nycrc.json)
default: "'.nycrc.json'"
dependsOn: cwd
keywords:
  - coverage
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--coverage-settings` / `-cs`

Path to the Istanbul configuration file (.nycrc.json).

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) |
| Default | `'.nycrc.json'` |
| Config key | `coverageSettings` |
| Short flag | `-cs` |

## Details

Points to a standard `.nycrc.json` file used to configure Istanbul (include/exclude patterns, etc.). If the file does not exist the default is silently ignored and Istanbul runs with built-in defaults augmented by the runner.

## Example

```bash
ui5-test-runner --coverage --coverage-settings .nycrc.json
ui5-test-runner --coverage -cs config/coverage.json
```
