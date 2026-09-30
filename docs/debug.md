---
"#type": task
title: How to troubleshoot
summary: Diagnose timeouts, unexpected failures, and missing coverage step by step
keywords:
  - troubleshoot
  - debug
  - timeout
  - logs
  - screenshots
  - diagnostics
relations:
  requires:
    - options/debugKeepBrowserOpen
    - options/log
    - options/logDump
    - options/logFilter
    - options/screenshotOnFailure
    - options/pageFilter
    - options/parallel
  see-also:
    - tipsNtricks
    - warnings
    - coverage
---

# How to troubleshoot

## When to use this guide

Reach for this when a run does not behave as expected: tests **time out**, a
page **fails unexpectedly**, or **coverage looks wrong**. The steps below move
from narrowing down *where* the problem is to *seeing* what the browser saw and
*reading* the traces.

## Narrow down the failure

Concurrency and volume make failures harder to read. Start by shrinking the run:

- Run one page at a time with [`--parallel 1`](./options/parallel.md) so logs
  and timing are not interleaved across parallel browsers.
- Isolate the failing page with
  [`--page-filter`](./options/pageFilter.md) so only the suspect page executes.

If the problem disappears at `--parallel 1`, it is likely a concurrency or
resource issue (see the performance tips in [Tips & tricks](./tipsNtricks.md)).

## See what the browser sees

- Launch a visible browser with [`--browser-visible`](./options/browserVisible.md)
  to watch the run in real time.
- Keep the browser open after the run with
  [`--debug-keep-browser-open`](./options/debugKeepBrowserOpen.md) so you can
  inspect the console, the network tab, and the DOM once the tests have stopped.

## Capture evidence

Turn on [`--screenshot-on-failure`](./options/screenshotOnFailure.md) to record
what the page looked like at the moment a test failed. The screenshots are
attached to the report in the report folder, so they survive a headless CI run
where you cannot watch the browser live.

## Read the traces

Every run records structured traces. To inspect them:

- Dump traces to stdout with [`--log <file>`](./options/log.md) together with
  [`--log-dump`](./options/logDump.md), instead of opening a browser.
- Narrow the dump to the entries you care about with
  [`--log-filter`](./options/logFilter.md), a `punyexpr` expression evaluated
  against each log entry.

## Warnings

If the run prints a warning code (for example `PKGVRS`, `COVMIS`, or `BATCHM`),
look it up in the [Warnings reference](./warnings.md) for what it means and how
to resolve it.

## Coverage looks wrong

Zero-percent files, missing files, or an aggregate that seems off are usually
explained by how instrumentation works — see [Coverage extraction](./coverage.md)
for the forced overrides and the `SKPNYC` / `COVMIS` / `COVALL` cases.

## Using the troubleshooting workflow

When driving the tool through Claude Code, the `troubleshooting` skill automates
much of the above: it reads the run's `report.json` (CTRF format) from the
report folder, summarises the status, and extracts traces from the latest
`traces-*.logz` file. Invoke it to get a guided diagnosis rather than running the
flags by hand.
