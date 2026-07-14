---
"#type": "[[option]]"
type: "[[string]]"
summary: command to be executed before the tests
tags:
  - legacy
  - remote
  - batch
see:
  - "[[cwd]]"
  - "[[startWaitUrl]]"
  - "[[startTimeout]]"
---

The command string accepts `{{optionName}}` placeholders, which are expanded at runtime using the value of the corresponding configuration option (e.g. `cwd`, `reportDir`). The command executes with `cwd` as its working directory.

The process is started in detached mode and will be automatically stopped after the tests complete.
