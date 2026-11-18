---
"#type": option
title: coverageOnly
type: string
multiple: yes
browserExposed: yes
summary: resource path prefixes to include in coverage (instrumentation and report)
keywords:
  - coverage
relations:
  see-also:
    - options/coverage
    - options/coverageNever
    - options/coverageRemoteInstrument
    - options/coverageSourceDir
    - coverage
    - coverage_scope
---
# `--coverage-only`

Resource path prefixes to include in coverage (instrumentation and report).

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Multiple | yes |
| Default | *none* |
| Config key | `coverageOnly` |

## Details

Restricts coverage collection to files whose filesystem path starts with at least one of the given
prefixes. Each prefix is a relative path such as `sap/ui/demo/todo/`, matched against the path of
each file relative to `--coverage-source-dir` (or `--webapp` when `--coverage-source-dir` is not
set).

Two effects:

1. **Instrumentation** — `?instrument=true` is not appended to module URLs that do not match any
   prefix, so they are never instrumented and never appear in `window.__coverage__`.
2. **Report** — the prefix is written as an Istanbul `include` glob so only matching files appear
   in the final merged report.

Because this option would otherwise be defeated by the `all: true` baseline (which enumerates every
file at 0%), the runner suppresses that baseline when the option is set at the CLI (`all` is forced
to `false`) or drops it after the run when the option comes from a testsuite. See
[Coverage scope and filtering](../coverage_scope.md#where-the-filters-come-from-and-the-baseline).

When this option is absent, all files (except those excluded by `--coverage-never`) are included.

The option can also be set per page from the testsuite, by passing `{ coverage: { only } }` as the
second argument of `addTestPage` in a `window.suite` / `jsUnitTestSuite` testsuite. The values apply
to that page and all OPA pages split from it. Keep the coverage scope consistent across a run — see
[Declaring the coverage scope from a testsuite](../coverage.md#declaring-the-coverage-scope-from-a-testsuite) and
[Keep coverage settings consistent across a run](../coverage.md#keep-coverage-settings-consistent-across-a-run).

## Example

```bash
# Include only application sources, exclude all else
ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.html --coverage \
  --coverage-only "sap/ui/demo/todo/"

# Include two namespaces
ui5-test-runner --url http://localhost:8080 --coverage \
  --coverage-only "my/app/" "my/lib/"
```
