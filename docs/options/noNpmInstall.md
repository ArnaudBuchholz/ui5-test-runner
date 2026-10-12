---
"#type": option
title: noNpmInstall
type: boolean
summary: prevent any NPM install
batchForwarded: yes
keywords:
  - npm
---
# `--no-npm-install`

prevent any NPM install

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `noNpmInstall` |
| Propagates to batch items | yes |

## Details

Prevents any package installation. Execution may fail if a required dependency is missing. Use this when network access is restricted or when all dependencies are guaranteed to be pre-installed.

## Example

```bash
ui5-test-runner --no-npm-install --url http://localhost:8080/test/testsuite.qunit.html
```