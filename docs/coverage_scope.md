---
"#type": concept
title: Coverage scope and filtering
summary: How coverage instrumentation and reporting scope is decided across modes, servers, and the only/never filter sources
keywords:
  - coverage
  - only
  - never
  - instrumentation
  - baseline
  - nyc
  - legacy
  - remote
relations:
  see-also:
    - coverage
    - options/coverageOnly
    - options/coverageNever
    - options/coverageSourceDir
    - options/coverageRemoteInstrument
  requires:
    - coverage
  affects:
    - modes/legacy
    - modes/remote
---
# Coverage scope and filtering

This document explains **which files end up in the coverage report** across the possible combinations
of mode, server, and the `only` / `never` filters (using [`--coverage-only`](./options/coverageOnly.md) /
[`--coverage-never`](./options/coverageNever.md) CLI options or defined in the test suite).
For the end-to-end instrumentation → execution → reporting pipeline, see [Coverage extraction](./coverage.md).

## Who instruments

The mode is derived from `--url`:

* absent → **legacy** meaning the runner serves `--webapp` itself
* present → **remote** meaning the URL points at some server

The mode governs *who serves* the application, but **not** who instruments.
The instrumentation decision is independent and taken in this order:

1. [`--coverage-source-dir`](./options/coverageSourceDir.md) **set** → the runner does **no** nyc
   instrumentation; the external server is expected to instrument on the fly, and the runner reads the
   sources from that local directory **only to produce the report**.
2. otherwise, [`--webapp`](./options/webapp.md) **points at an existing folder** → the runner
   instruments those sources locally up front with `nyc instrument`.
3. otherwise → no instrumentation happens.

So nyc-based local instrumentation is **not** tied to legacy mode: a remote run with `--webapp` set (and
no `--coverage-source-dir`) still has the runner instrument locally.

| Instrumentation | When | How `only`/`never` filters |
|---|---|---|
| **Local, up front** (`nyc instrument`) | `--coverage-source-dir` unset **and** `--webapp` is a local folder (legacy, or remote with a local webapp) | nyc `include`/`exclude` globs only — the browser instrumentation gate is inert (the server serves the instrumented copy regardless of `?instrument=true`) |
| **On the fly** (external server) | `--coverage-source-dir` set, e.g. `@ui5/cli` + `@ui5/middleware-code-coverage` (or any server honouring `?instrument=true`) | the browser instrumentation gate (whether `?instrument=true` is appended) **and** nyc `include`/`exclude` at report time |
| **None** | `--coverage-source-dir` unset **and** no local `--webapp` | — (no coverage collected) |

With local instrumentation, `only`/`never` act purely through the generated `.nycrc.json` globs. With
on-the-fly instrumentation, the browser-side gate additionally decides, per request, whether the server
instruments the file at all — so a filtered-out module produces no `window.__coverage__` entry even
before reporting.

The mechanism above is the same whichever way the filters are supplied — command line or testsuite (see
the next section). A testsuite declares them per page, but the runner **forwards** the collected
`only`/`never` into the run-wide `coverageOnly`/`coverageNever`, so they feed both the browser gate (via
the per-page config injected into `window['ui5-test-runner'].config`) and the nyc `include`/`exclude`
globs in the regenerated `.nycrc.json`. This report-side forwarding is what makes filtering work even
in legacy mode, where the browser gate is inert. The source only changes how the `all: true` baseline is
handled, not how a file is matched.

Either way, the final report is filtered consistently, because `only` → Istanbul `include` and
`never` → Istanbul `exclude`, and **`never` wins over `only`** (the gate checks `never` first; Istanbul's
`exclude` overrides `include`). This lets the two combine as "a scope minus a pocket inside it", e.g.
`--coverage-only controller/ --coverage-never controller/App.controller.js`.

## Where the filters come from, and the baseline

`only`/`never` can be supplied two ways, and each neutralizes the nyc `all: true` default differently.
`all: true` makes nyc emit a zero-hit **baseline** for every file (so files never executed still appear
at 0%); if left in place it would reintroduce exactly the files the filter removes.

| Filter source | How it is declared | Effect on the `all: true` baseline |
|---|---|---|
| **Command line** | `--coverage-only` / `--coverage-never` (or the `coverageOnly`/`coverageNever` config keys) | known up front → the generated `.nycrc.json` is forced to `all: false`, so **no baseline is produced** |
| **Testsuite** | `addTestPage(url, { coverage: { only, never } })`, including the declarative `*.suite.qunit.js` form the UI5 Test Starter converts into `addTestPage` | discovered mid-run → the baseline was already generated, so the runner **deletes the baseline files** before merging (logging `coverage only/never detected from testsuite` once) |

In both cases the outcome is the same: **files that were not executed do not appear in the report**. The
difference is only *when* the baseline is suppressed — before generation (command line) or after it
(testsuite).

### Keep the scope consistent across a run

Coverage filtering is resolved **per run**, not per page. The runner collects every testsuite page's
`only`/`never` and applies their **deduped union** to the single `.nycrc.json` used by `nyc report` for
the whole run (the same way a single `--coverage-only`/`--coverage-never` would apply globally).

> ⚠️ **Mixing suites with different `only`/`never` in one `ui5-test-runner` invocation (including
> multiple `--url` values) produces misleading results.** Because the scopes are unioned, a file that
> suite A wanted to exclude is still reported if suite B (or the CLI) includes it, and vice versa — the
> report reflects the union, not each suite's intent. The baseline is likewise suppressed for the whole
> run, so a suite with no filters loses its `all: true` baseline as soon as any other suite declares one.

**Recommendation: isolate each distinct coverage scope in its own run.** If different suites or projects
need different `only`/`never`, run them separately (one invocation each) and
[aggregate](./coverage.md#aggregate-coverage-for-several-projects) the resulting coverage files into a
single report. Keep `only`/`never` identical across all sources within any one run.

See [Restricting the covered scope](./coverage.md#restricting-the-covered-scope) for the testsuite
declaration syntax.
