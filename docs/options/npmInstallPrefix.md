---
"#type": option
title: npmInstallPrefix
type: fs-entry
typeModifiers:
  - overwrite
summary: Directory used as the npm --prefix install target when --npm-install is set to prefix
dependsOn: cwd
keywords:
  - npm
relations:
  see-also:
    - options/npmInstall
---
# `--npm-install-prefix`

path used as --prefix when npmInstall is set to prefix

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) (overwrite) |
| Default | *none* |
| Config key | `npmInstallPrefix` |

## Details

Used as the `--prefix` argument to npm when [`--npm-install`](./npmInstall.md) is set to `prefix`. Specifies the directory where packages are installed; it is created if it does not already exist. Has no effect with other `--npm-install` strategies.

## Example

```bash
ui5-test-runner --npm-install prefix --npm-install-prefix ./vendor
```
