---
"#type": option
title: batch
type: string
summary: batch item specification (folder, config file, or regex pattern)
multiple: yes
keywords:
  - multi-project
  - folder
relations:
  affects:
    - modes/batch
---
# `--batch`

Batch item specification (folder, config file, or regex pattern).

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Multiple | yes |
| Default | *none* |
| Config key | `batch` |

## Details

Each value selects one or more test projects to run as independent child processes. Accepted formats:

- **Folder path**: runs `--cwd <folder>`
- **JSON config file path**: runs `--config <file>`
- **Regular expression**: recursively scans `--cwd` and collects matching folders and config files. The pattern is tested against the path **relative to `--cwd`** (separators normalized to `/`) and can be implicitly anchored at the start (`^`), so `^test/e2e/[\w_]*\.json` matches only entries whose path begins with `test/e2e/`.

Specifying at least one `--batch` value activates batch mode. The option can be given multiple times (or with multiple values) to add several items.

Batch items are executed in parallel according to [`--parallel`](./parallel.md). Note this **multiplies** concurrency: each batch item itself runs its own test pages in parallel, so with the default `--parallel 2` you get 2 batch items × 2 pages = up to **4 browsers** running at once. Size `--parallel` against available resources, and see [batch mode](../modes/batch.md) for the full picture.

> **Note:** When recursively scanning folders with a regular expression, the following file and folder names are ignored: `node_modules` and names starting with `.` (`.git`, `.claude`, ...)

## Example

```bash
ui5-test-runner --batch ./packages/app1 ./packages/app2
ui5-test-runner --batch "^test/e2e/[\w_]*\.json"
```
