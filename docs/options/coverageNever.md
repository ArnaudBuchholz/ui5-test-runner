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
   from the final merged report (covers files added by the `--coverage-source-dir` baseline).

When this option is absent, no files are excluded (beyond those already excluded by
`--coverage-source-dir` directory defaults and the user's `.nycrc.json`).

The option can also be set implicitly from the testsuite page config: if a test page loaded via
a `testsuite.qunit.html` declares `coverage.never`, the runner applies those values to that page and
all OPA pages split from it.

## Example

```bash
# Exclude test files from the report
ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.html --coverage \
  --coverage-never "test/"

# Exclude multiple prefixes
ui5-test-runner --url http://localhost:8080 --coverage \
  --coverage-never "test/" "mock/"
```
