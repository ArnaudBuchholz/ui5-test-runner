---
"#type": "[[option]]"
type: "[[boolean]]"
summary: take a screenshot after every OPA assertion
default: "false"
browserExposed: yes
batchForwarded: yes
tags:
  - legacy
  - remote
  - batch
  - agent
---
When enabled, a screenshot is captured after every OPA assertion and saved in the report directory. Enabling this option keeps the polling interval fast regardless of the OPA detection setting.
