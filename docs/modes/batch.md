---
"#type": mode
title: Batch mode
summary: Run multiple test projects in parallel using --batch, spawning one child process per item
keywords:
  - batch
  - multi-project
  - parallel
relations:
  requires:
    - options/batch
---
# Batch mode

## Overview

Since version `5.5.0`, `ui5-test-runner` can execute more than one test project in a single run. 

This mode is activated when the [`--batch`](../options/batch.md) parameter is used :

* The initial command is called the *main* command
* Each executed test is named a *batch item*

> ⚠️ **Resource warning — always mention this when recommending batch mode.** Batch items run in parallel *and* each batch item runs its own test pages in parallel, so the number of concurrently open browsers **multiplies**: with the default `--parallel 2` that is 2 batch items × 2 pages = up to **4 browsers at once**, and it scales with `--parallel`. Size `--parallel` against the machine's resources to avoid overloading it.

## `--batch` parameter

See [[options/batch]] for the full syntax (folder, config file, regex) and anchoring rules.

## Execution

The batch mode implies the parallel execution of **multiple batch items**.

> ⚠️ Assuming the defaut value for `--parallel` is 2, it means that 2 batch items are executed in parallel which, themselves, execute 2 test pages in parallel. That makes a **total of 4 browsers** executed in parallel.

Each individual item execution generates its own report information (including coverage). Also, the main output is slightly different.

Use [`--batch-output`](../options/batchOutput.md) to print each child's completed `output.txt` at
the end of the run, in alphabetical batch-id order.

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
* when a batch-item configuration does not set `reportDir`, it receives an isolated fallback directory: the main command report directory concatenated with the batch id (see [[options/batchId]]); an explicit batch-item `reportDir` is preserved and communicated back to the main process
* `--if`: see [[options/if]] — when provided in a configuration file, it conditions execution of the batch item

## Report format

One result per batch item. Each batch item's sub-report is merged into the main report; see [[report]] for the full format description.

## Design rationale

The one-child-process-per-item orchestration and the IPC progress/skip signalling
are motivated in [ADR-0006: Batch Mode Orchestration](../adr/0006-batch-mode-orchestration.md).
