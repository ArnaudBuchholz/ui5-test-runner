---
"#type": option
title: splitOpa
short: so
type: boolean
summary: split OPA tests by QUnit module, creating one test page per module
batchForwarded: yes
browserExposed: yes
keywords:
  - legacy
  - remote
  - batch
---
When enabled, OPA test pages are automatically split into individual test pages — one per QUnit module — enabling parallel execution without changing the OPA bootstrap page.
