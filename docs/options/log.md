---
"#type": option
title: log
type: fs-entry
typeModifiers:
  - file
summary: path to a .logz trace file produced by a previous run; activates log viewer mode
dependsOn: cwd
keywords:
  - debug
  - trace
  - logz
validation:
  - message: "this option cannot be combined with other mode options"
    conditions:
      - "mode === 'log'"
relations:
  see-also:
    - modes/log
    - options/logDump
    - options/logFilter
---
Pass the path to a `traces-YYYYMMDD-HHMMSS.logz` file written to `reportDir` by a previous test run. Activates [log viewer mode](../modes/log.md).
