---
"#type": option
title: ci
type: boolean
summary: forces CI mode (no interactive output)
batchForwarded: yes
default: "!process.stdout.isTTY"
keywords:
  - legacy
  - remote
  - batch
relations:
  see-also:
    - options/reportDir
---
By default, the runner detects when executed in an interactive output. It then renders dynamic progress bars while generating a static output in the [reportDir](./reportDir.md) folder. When executed in a pipeline, the output matches the static one. This option controls this behavior.
