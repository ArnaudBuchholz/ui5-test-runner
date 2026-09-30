---
"#type": option
title: screenshot
type: boolean
summary: take a screenshot after every OPA assertion
browserExposed: yes
batchForwarded: yes
keywords:
  - agent
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
When enabled, a screenshot is captured after every OPA assertion and saved in the report directory. Enabling this option keeps the agent polling interval fast regardless of the OPA detection setting.
