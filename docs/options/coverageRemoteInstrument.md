---
"#type": option
title: coverageRemoteInstrument
type: regexp
multiple: yes
summary: resources sub-paths to instrument for coverage in remote mode
browserExposed: yes
keywords:
  - coverage
  - instrument
  - remote
  - library
relations:
  affects:
    - modes/remote
  see-also:
    - options/coverage
    - options/coverageSourceDir
    - coverage
---
# `--coverage-remote-instrument`

Resources sub-paths to instrument for coverage in remote mode.

## Overview

| | |
|---|---|
| Type | [`regexp`](types/regexp.md) |
| Multiple | yes |
| Default | *none* |
| Config key | `coverageRemoteInstrument` |

## Details

In remote mode, ui5-test-runner appends `?instrument=true` to script URLs so that
[`@ui5/middleware-code-coverage`](https://www.npmjs.com/package/@ui5/middleware-code-coverage)
instruments them on the fly.

**By default, files served under `resources/` and `test-resources/` are NOT instrumented.**
These are UI5 framework (and library) sources; appending `?instrument=true` to them busts the
browser cache and defeats UI5 preload bundling, which forces every module to be fetched
individually and can slow application startup enough to fail tests. Application code (anything
outside `resources/`/`test-resources/`) is always instrumented.

When **testing a UI5 library**, the library's own sources are served under `resources/` and would
be excluded by this default. Use this option to opt specific sub-paths back in. Each value is a
regular expression matched against the path **below** `resources/` (or `test-resources/`) — so you
write `^my/lib/`, not a pattern containing `resources`. A `resources/` file is instrumented when at
least one pattern matches its sub-path.

**This option only has an effect in remote mode**, where `?instrument=true` is honoured by
`@ui5/middleware-code-coverage`. In legacy mode the runner serves pre-instrumented files by path and
ignores the query parameter; setting this option there logs a warning that it has no effect. See
[Coverage extraction](../coverage.md).

## Example

```bash
# Test a library: instrument only its own sources under resources/my/lib/
ui5-test-runner --url http://localhost:8080 --coverage --coverage-remote-instrument "^my/lib/"

# Instrument two library namespaces
ui5-test-runner --url http://localhost:8080 --coverage --coverage-remote-instrument "^my/lib/" "^my/other/"
```
