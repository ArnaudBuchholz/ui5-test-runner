---
"#type": option
title: npmAllowInstallScripts
type: boolean
summary: allow postinstall scripts when installing missing packages
batchForwarded: yes
keywords:
  - npm
  - security
relations:
  see-also:
    - options/npmInstall
    - options/noNpmInstall
---
# `--npm-allow-install-scripts`

allow postinstall scripts when installing missing packages

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `npmAllowInstallScripts` |
| Propagates to batch items | yes |

## Details

By default, `--ignore-scripts` is passed to npm during auto-installation to prevent postinstall scripts from running. Set this option to allow postinstall scripts.

## Example

```bash
ui5-test-runner --npm-allow-install-scripts --url http://localhost:8080/test/testsuite.qunit.html
```
