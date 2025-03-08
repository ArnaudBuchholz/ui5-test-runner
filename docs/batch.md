# Batch mode

## Overview

With version `5.5.0`, `ui5-test-runer` can execute more than one test project in a single run.

Batch mode is activated when the `--batch` parameter is used :

* The initial command is called the *main* command
* Each executed test is named a *batch item*

## `--batch` parameter 

The `--batch` parameter accepts multiple values and supports three kind of parameters :

* A **folder** : execution of `ui5-test-runner --batch <folder>` triggers the execution of `ui5-test-runner --cwd <folder>`

* A **configuration file** *(for instance: `ui5-test-runner.json`)* : execution `ui5-test-runner --batch <config.json>` triggers the execution of `ui5-test-runner --config <config.json>`

* A **regular expression** : if the value does not match any folder or file name, it is interpreted as a regular expression. Then, `ui5-test-runner` *recursively* scans the current working directory (`--cwd`) and when :

  * a folder matches the regular expression : it adds `--batch <folder>`

  * a JSON file matches the regular expression : it adds `--batch <filename>`

Once all the values are processed, `ui5-test-runner` starts the execution of all identified batch items in parallel (using the value of `--parallel`).

## Execution

Unlike the normal execution flow where the runner ensures :

* the parallel execution of several pages (QUnit or OPA),
* the generation of a single report.

Batch mode implies the parallel execution of **multiple batch items**.

> ⚠️ Assuming the defaut value for `--parallel` is 2, it means that you will have 2 batch items executed in parallel which, themselves, execute 2 test pages in parallel. That makes a total of 4 browsers executed in parallel.

Each individual item execution generates its own report information (including coverage). Also, the main output is slightly different.

```batch
✔️  Legacy JS Sample (JS_LEGACY)
✔️  JSDOM browser (JSDOM)
✔️  Legacy JS Sample with coverage (JS_LEGACY_COVERAGE)
✔️  Legacy JS Sample with junit XML report (JS_LEGACY_JUNIT_REPORT)
[░░░░░░░░░░]   0% Legacy JS Sample (no script injection) (JS_LEGACY_NO_SCRIPT)
[-starting-]      Legacy JS Sample accessed using --url (JS_LEGACY_REMOTE)
⠹ Running batch items...
```

> Example of batch output

New parameters and behaviors are introduced to control execution :

* `--report-dir`: when used in the main command, all batch items report folders are overridden to generate a folder under the main `--report-dir`.

* `--batch-id`: if provided in the config file, this condition the sub folder name used under the overridden `--report-dir`.

* `--batch-label`: if provided in the config file, the label is used in the main command output.
