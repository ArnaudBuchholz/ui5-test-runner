---
"#type": "[[option]]"
type: "[[string]]"
summary: command to be executed after the tests
tags:
  - legacy
  - remote
  - batch
see:
  - "[[cwd]]"
---

The command string accepts `{{optionName}}` placeholders, which are expanded at runtime using the value of the corresponding configuration option (e.g. `cwd`, `reportDir`). The command executes with `cwd` as its working directory.

> **Note:** The exit code of the end command overrides the runner's exit code, allowing you to enforce failure or suppress errors from the test execution.
