---
"#type": option
title: debugNpmNoLocal
type: boolean
summary: Simulates a locally-absent package so the runner falls back to global or prefix resolution (development/testing only)
keywords:
  - debug
  - npm
relations:
  see-also:
    - options/npmInstall
    - options/npmInstallPrefix
---
# `--debug-npm-no-local`

Ignore locally-resolvable packages, forcing global/prefix resolution and install (development only).

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `debugNpmNoLocal` |

## Details

When set, `Npm.import` skips the top-level dynamic import and the local `node_modules` probe, so
resolution falls through to the global root and any configured [`--npm-install-prefix`](./npmInstallPrefix.md) /
[`--alternate-npm-path`](./alternateNpmPath.md) — and, when the package is absent there too, triggers
an [`--npm-install`](./npmInstall.md). Intended for development and testing only: it lets a test force
the install-then-reimport path even when the package is already present locally.

## Example

```bash
ui5-test-runner --debug-npm-no-local --npm-install prefix --npm-install-prefix ./vendor
```
