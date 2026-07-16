---
"#type": "[[option]]"
type: "[[string]]"
summary: skip execution if the expression evaluates to falsy
tags:
  - batch
---
The expression is evaluated using `punyexpr` with `Host.env` variables and `NODE_MAJOR_VERSION` available as context. If the result is falsy the runner exits immediately without running any tests.
