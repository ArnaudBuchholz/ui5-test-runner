---
"#type": option
title: pageParams
short: pp
type: string
summary: add parameters to page URL
keywords:
  - remote
  - batch
batchForwarded: yes
---
Expected syntax is `param1=value1&param2=value2`. Value is not validated and concatenated automatically to any opened URL (using `?`if no parameter exists, `&` otherwise).
