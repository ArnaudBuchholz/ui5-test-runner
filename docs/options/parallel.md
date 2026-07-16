---
"#type": "[[option]]"
short: p
type: "[[integer]]"
summary: number of parallel executions
batchForwarded: yes
default: "2"
browserExposed: yes
tags:
  - legacy
  - remote
  - batch
---
This option controls how many parallel executions can occur inside the runner. For instance, when dealing with multiple pages to test, this will determine how many pages are run simultaneously.
