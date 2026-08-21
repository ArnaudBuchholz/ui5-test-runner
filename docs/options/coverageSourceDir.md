---
"#type": "[[option]]"
type: "[[fs-entry]]"
typeModifiers:
  - "[[safe-default]]"
summary: directory containing the source files used for coverage reporting
dependsOn: "[[cwd]]"
tags:
  - remote
see:
  - "[[webapp]]"
  - "[[coverageSettings]]"
---
When set, this directory is used as the `cwd` for nyc reporting instead of `[[webapp]]`, and local instrumentation is skipped. Use this when source files are served by an external server with its own instrumentation (e.g. `@ui5/middleware-code-coverage`) but are still accessible locally for coverage reporting.
