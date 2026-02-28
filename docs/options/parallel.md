---
"#type": "[[option]]"
short: p
type: "[[integer]]"
summary: number of parallel executions
default: "2"
tags:
  - legacy
  - remote
  - capabilities
  - batch
---
This option controls how many parallel executions can occur inside the runner. For instance, when dealing with multiple pages to test, this will determine how many pages are run simultaneously.
