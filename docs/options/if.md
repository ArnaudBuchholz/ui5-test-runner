---
"#type": option
title: if
type: string
summary: skip execution if the expression evaluates to falsy
keywords:
  - batch
---
The expression is evaluated using `punyexpr` with `Host.env` variables and `NODE_MAJOR_VERSION` available as context. If the result is [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) the runner exits immediately without running any tests.
