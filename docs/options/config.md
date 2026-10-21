---
"#type": option
title: config
type: fs-entry
typeModifiers:
  - file
  - safe-default
summary: read options from a configuration file
default: "'ui5-test-runner.json'"
dependsOn: cwd
keywords:
  - options
  - json
  - file
relations:
  affects:
    - modes/legacy
    - modes/remote
---
# `--config`

Read options from a configuration file.

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) |
| Default | `'ui5-test-runner.json'` |
| Config key | `config` |

## Details

The configuration file is a JSON object whose property names match option names in lowerCamelCase. It is applied **before** command-line parameters, so CLI values override the file.

To **force** a value that cannot be overridden by the command line, prefix the property name with `!`:

```json
{
  "!pageTimeout": 900000,
  "globalTimeout": 3600000,
  "failFast": true
}
```

Options that accept multiple values (e.g. `--lib`) can be a single string or an array:

```json
{
  "lib": [
    "my/namespace/lib/=../my.namespace.lib/src/my/namespace/lib/",
    "my/namespace/lib2/=../my.namespace.lib2/src/my/namespace/lib2/"
  ]
}
```

A configuration file may itself set `config` to point at another file, letting configurations build on a shared base. These references are resolved recursively, up to a nesting depth of 10; a deeper chain fails with a nesting-depth error.

## Example

```bash
ui5-test-runner --config my-runner.json
ui5-test-runner --config /path/to/project/ui5-test-runner.json
```
