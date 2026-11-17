---
"#type": option
title: jest
short: je
type: boolean
summary: run the test page as a jest suite using the built-in jest runtime
batchForwarded: yes
browserExposed: yes
keywords:
  - agent
  - remote
  - batch
---
# `--jest` / `-je`

Run the test page as a jest suite using the built-in jest runtime.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `jest` |
| Short flag | `-je` |
| Propagates to batch items | yes |

## Details

When enabled, the agent runs the test page with a built-in jest-compatible runtime (`describe` / `test` / `expect` / `jest.*`) instead of detecting QUnit, and builds the report from the runtime's own lifecycle events. The page only needs to load its spec files and `sinon`.

## Example

```bash
ui5-test-runner --jest
ui5-test-runner --jest --url http://localhost:8080/test/unit/unitTests.jest.html
```
