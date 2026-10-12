---
"#type": option
title: if
type: string
summary: skip execution if the expression evaluates to falsy
keywords:
  - conditional
  - skip
  - guard
relations:
  affects:
    - modes/batch
---
The expression is evaluated using [`punyexpr`](https://www.npmjs.com/package/punyexpr). If the result is [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) the runner exits immediately without running any tests.

`--if` can be used both at the top-level CLI and inside batch item configuration files.

## Expression context

The following variables are available in the expression:

| Variable | Type | Value |
|---|---|---|
| `NODE_MAJOR_VERSION` | number | Node.js major version (e.g. `24`) |
| `NODE_VERSION` | string | Full Node.js version string (e.g. `v24.11.1`) |
| `UI5TR_NAME` | string | Runner package name (`ui5-test-runner`) |
| `UI5TR_VERSION` | string | Runner version string (e.g. `6.0.0`) |
| `compareVersions` | function | `compareVersions(a, b)` returns `-1`, `0`, or `1` |
| `implemented` | function | `implemented(optionName)` returns `true` if the option exists in this version |
| *(any env var)* | string | All current environment variables are spread into the context |

## Examples

```
--if "NODE_MAJOR_VERSION >= 24"
--if "ALL_TESTS === 'true'"
--if "compareVersions(UI5TR_VERSION, '6.0.0') >= 0"
--if "implemented('splitOpa')"
```
