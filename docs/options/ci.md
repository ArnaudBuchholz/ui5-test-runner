---
"#type": "[[option]]"
type: "[[boolean]]"
summary: forces CI mode (no interactive output)
default: "!process.stdout.isTTY"
tags:
  - legacy
  - remote
  - capabilities
  - batch
see:
  - "[[reportDir]]"
---
By default, the runner detects when executed in an interactive output. It then renders dynamic progress bars while generating a static output in the [[reportDir]] folder. When executed in a pipeline, the output matches the static one. This option controls this behavior.
