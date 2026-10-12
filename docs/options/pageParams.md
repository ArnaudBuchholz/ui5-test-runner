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
# `--page-params` / `-pp`

add parameters to page URL

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | *none* |
| Config key | `pageParams` |
| Short flag | `-pp` |
| Propagates to batch items | yes |

## Details

Expected syntax is `param1=value1&param2=value2`. The value is not validated and is concatenated automatically to any opened URL (using `?` if no parameter exists, `&` otherwise). Typical use: setting the UI5 locale via `sap-ui-language=DE`.

## Example

```bash
ui5-test-runner --page-params sap-ui-language=DE
ui5-test-runner --page-params "sap-ui-language=DE&sap-ui-theme=sap_horizon"
```
