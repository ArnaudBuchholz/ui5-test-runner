---
"#type": option
title: webapp
type: fs-entry
typeModifiers:
  - safe-default
summary: base folder of the UI5 application
default: "'webapp'"
dependsOn: cwd
keywords:
  - webapp
  - application
  - folder
relations:
  affects:
    - modes/legacy
---
# `--webapp`

Base folder of the UI5 application.

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) |
| Default | `'webapp'` |
| Config key | `webapp` |

## Details

Any `/resources/` or `/test-resources/` path is first looked up inside the webapp folder before being proxied to the [ui5](./ui5.md) CDN. This means a library cloned or copied into `webapp/resources/` is served automatically without needing a [lib](./lib.md) mapping.

In legacy mode, this folder is also the instrumentation root for coverage: source files are resolved relative to it when generating coverage reports.

## Example

```bash
ui5-test-runner --webapp src
ui5-test-runner --webapp ./my-app --coverage
```
