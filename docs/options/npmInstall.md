---
"#type": option
title: npmInstall
type: string
summary: npm install strategy for missing packages
default: "'global'"
keywords:
  - npm
relations:
  see-also:
    - options/noNpmInstall
    - options/npmInstallPrefix
    - options/npmInstallMinReleaseAge
---
# `--npm-install`

npm install strategy for missing packages

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | `'global'` |
| Config key | `npmInstall` |

## Details

Controls how missing packages are installed automatically. Accepted values:

- `local` — installs with `--no-save` in the current directory
- `global` — installs with `-g`
- `prefix` — installs with `--prefix <npmInstallPrefix>` (requires [`--npm-install-prefix`](./npmInstallPrefix.md))

## Example

```bash
ui5-test-runner --npm-install local
ui5-test-runner --npm-install prefix --npm-install-prefix ./vendor
```
