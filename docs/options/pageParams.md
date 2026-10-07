---
"#type": option
title: pageParams
short: pp
type: string
summary: add parameters to page URL
batchForwarded: yes
keywords:
  - params
  - query
  - url
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
Expected syntax is `param1=value1&param2=value2`. Value is not validated and concatenated automatically to any opened URL (using `?`if no parameter exists, `&` otherwise).
