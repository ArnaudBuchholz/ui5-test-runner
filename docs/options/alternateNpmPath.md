---
"#type": option
title: alternateNpmPath
type: fs-entry
summary: additional path the runner searches for npm packages after the local and global locations
keywords:
  - npm
batchForwarded: yes
dependsOn: cwd
---
# `--alternate-npm-path`

Additional path the runner searches for npm packages after the local and global locations.

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) |
| Default | *none* |
| Config key | `alternateNpmPath` |
| Propagates to batch items | yes |

## Search order

When searching for packages, the runner checks paths in the following order:

1. local
2. global
3. alternate *(this option, if specified)*
4. [`npmInstallPrefix`](./npmInstallPrefix.md) *(if specified)*

## Example

```bash
ui5-test-runner --alternate-npm-path /opt/company/npm-cache
```
