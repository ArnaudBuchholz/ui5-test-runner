---
"#type": mode
title: Batch mode
summary: execute more than one test project in a single run
keywords:
  - batch
  - multi-project
  - parallel
---

# Batch mode

## Overview

Since version `5.5.0`, `ui5-test-runer` can execute more than one test project in a single run. 

This mode is activated when the [`--batch`](../options/batch.md) parameter is used :

* The initial command is called the *main* command
* Each executed test is named a *batch item*

> 🧠TODO we might merge the ## `--batch` parameter section with the batch.md description. It is not worth repeating it here.

## `--batch` parameter 

The `--batch` parameter accepts multiple values and supports three kind of parameters :

* A **folder** : execution of `ui5-test-runner --batch <folder>` triggers the execution of `ui5-test-runner --cwd <folder>`

* A **configuration file** *(for instance: `ui5-test-runner.json`)* : execution `ui5-test-runner --batch <config.json>` triggers the execution of `ui5-test-runner --config <config.json>`

* A **regular expression** : if the value does not match any folder or file name, it is interpreted as a regular expression. Then, `ui5-test-runner` *recursively* scans the current working directory (`--cwd`) and when :

  * a folder matches the regular expression : it adds `--batch <folder>`

  * a JSON file matches the regular expression : it adds `--batch <filename>`

  The regex is tested against the **path relative to `--cwd`**, with path separators normalized to `/`. A `^` anchor can be prepended, so the pattern must match from the start of the relative path. For example, `^test/e2e/[\w_]*\.json` matches `test/e2e/app.json` but not `.worktrees/branch/test/e2e/app.json`.

Once all the values are processed, `ui5-test-runner` starts the execution of all identified batch items in parallel (using the value of `--parallel`).

## Execution

The batch mode implies the parallel execution of **multiple batch items**.

> ⚠️ Assuming the defaut value for `--parallel` is 2, it means that 2 batch items are executed in parallel which, themselves, execute 2 test pages in parallel. That makes a **total of 4 browsers** executed in parallel.

Each individual item execution generates its own report information (including coverage). Also, the main output is slightly different.

```batch
   00:08 succeeded Legacy JS Sample with batch timeout (JS_LEGACY_BATCH_TIMEOUT)
   00:14 succeeded Legacy JS Sample (JS_LEGACY)
   00:17 succeeded Legacy JS Sample with coverage (JS_LEGACY_COVERAGE)
   00:22 succeeded Legacy JS Sample lib with coverage (JS_LEGACY_COVERAGE_LIB)
   [##########]100% Legacy JS Sample with coverage threshold failure (JS_LEGACY_COVERAGE_FAIL)
   [###-------] 33% Legacy JS Sample with global timeout (JS_LEGACY_GLOBAL_TIMEOUT)
[/][#---------] 10% Executing batch items
```

In order to better organize and control the exeuction of batch items, multiple mechanisms exist :

* some options are configured to be forwarded from the main command to the batch item, they are tagged with `batchForwarded: yes`

> 🧠TODO check the following statement
* the batch item report dir is the main command one concatenated with the batch id (see [--batch-id])

> 🧠TODO here again I don't see the value of repeating the description, it should be merged with if.md and only refer that this option can be used to control execution
* `--if`: if provided in a configuration file, it conditions the execution of the batch item. The expression can test any environment variable (for instance: `--if "ALL_TESTS === 'true'"`) or use the Node.js' major version (`--if "NODE_MAJOR_VERSION >= 20"`).

## Report format

> 🧠TODO elaborate
One result per batch item

> 🧠TODO anything missing ?
