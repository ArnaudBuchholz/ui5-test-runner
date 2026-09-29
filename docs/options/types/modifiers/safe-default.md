---
"#type": concept
title: safe-default modifier
summary: Modifier that skips validation of an fs-entry option when its default value is used and not overridden.
keywords:
  - safe-default
  - modifier
  - fs-entry
relations:
  affects:
    - options/types/fs-entry
---
Option validation does not fail if the default value is used *(and not overridden)*.

This is used for options whose default points to a file-system entry that may legitimately be absent, so the runner should not error out unless the user explicitly provides a value.

For instance:

* [`webapp`](../../webapp.md) defaults to the `webapp` folder. Some runs have no local application at all (for instance testing a remote server through `--url`), so that folder legitimately does not exist; validation is skipped when the default is used and only runs if the user passes a value.
* [`config`](../../config.md) defaults to `ui5-test-runner.json`. Most runs have no configuration file, so the default is tolerated when absent; passing an explicit path validates that the file exists.
