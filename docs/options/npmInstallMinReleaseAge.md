---
"#type": option
title: npmInstallMinReleaseAge
type: integer
typeModifiers:
  - positive
summary: minimum release age (in days) required before installing a package
default: 3
batchForwarded: yes
keywords:
  - npm
  - security
relations:
  see-also:
    - options/npmInstall
    - options/noNpmInstall
---
# `--npm-install-min-release-age`

minimum release age (in days) required before installing a package

## Overview

| | |
|---|---|
| Type | [`integer`](types/integer.md) (positive) |
| Default | `3` |
| Config key | `npmInstallMinReleaseAge` |
| Propagates to batch items | yes |

## Details

Passes `--min-release-age=<N>` to npm during auto-installation to avoid installing recently published packages. Set to `0` to disable.

## Example

```bash
ui5-test-runner --npm-install-min-release-age 7
ui5-test-runner --npm-install-min-release-age 0
```
