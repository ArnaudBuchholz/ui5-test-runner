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
   in the final merged report (covers files added by the `--coverage-source-dir` baseline).

When this option is absent, all files (except those excluded by `--coverage-never`) are included.

The option can also be set implicitly from the testsuite page config: if a test page loaded via
a `testsuite.qunit.html` declares `coverage.only`, the runner applies those values to that page and
all OPA pages split from it.

## Example

```bash
# Include only application sources, exclude all else
ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.html --coverage \
  --coverage-only "sap/ui/demo/todo/"

# Include two namespaces
ui5-test-runner --url http://localhost:8080 --coverage \
  --coverage-only "my/app/" "my/lib/"
```
