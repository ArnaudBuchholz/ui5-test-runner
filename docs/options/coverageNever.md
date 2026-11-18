---
"#type": option
title: coverageNever
type: string
multiple: yes
browserExposed: yes
summary: resource path prefixes to exclude from coverage (instrumentation and report)
keywords:
  - coverage
relations:
  see-also:
    - options/coverage
    - options/coverageOnly
    - options/coverageRemoteInstrument
    - options/coverageSourceDir
    - coverage
    - coverage_scope
---
# `--coverage-never`

Resource path prefixes to exclude from coverage (instrumentation and report).

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Multiple | yes |
| Default | *none* |
| Config key | `coverageNever` |

## Details

Prevents coverage collection for files whose filesystem path starts with any of the given prefixes.
Each prefix is a relative path such as `test/`, matched against the path of each file relative to
`--coverage-source-dir` (or `--webapp` when `--coverage-source-dir` is not set).

Two effects:

1. **Instrumentation** — `?instrument=true` is not appended to module URLs that match a prefix, so
   those files are never instrumented and never appear in `window.__coverage__`.
2. **Report** — the prefix is written as an Istanbul `exclude` glob so matching files are dropped
   from the final merged report.

Because this option would otherwise be defeated by the `all: true` baseline (which enumerates every
file at 0%, reintroducing the excluded ones), the runner suppresses that baseline when the option is
set at the CLI (`all` is forced to `false`) or drops it after the run when the option comes from a
testsuite. See [Coverage scope and filtering](../coverage_scope.md#where-the-filters-come-from-and-the-baseline).

When this option is absent, no files are excluded (beyond those already excluded by
`--coverage-source-dir` directory defaults and the user's `.nycrc.json`).

The option can also be set per page from the testsuite, by passing `{ coverage: { never } }` as the
second argument of `addTestPage` in a `window.suite` / `jsUnitTestSuite` testsuite. The values apply
to that page and all OPA pages split from it. Keep the coverage scope consistent across a run — see
[Declaring the coverage scope from a testsuite](../coverage.md#declaring-the-coverage-scope-from-a-testsuite) and
[Keep coverage settings consistent across a run](../coverage.md#keep-coverage-settings-consistent-across-a-run).

## Example

```bash
# Exclude test files from the report
ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.html --coverage \
  --coverage-never "test/"

# Exclude multiple prefixes
ui5-test-runner --url http://localhost:8080 --coverage \
  --coverage-never "test/" "mock/"
```
