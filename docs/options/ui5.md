---
"#type": option
title: ui5
type: url
summary: UI5 url
default: "'https://ui5.sap.com'"
batchForwarded: yes
keywords:
  - ui5
  - version
  - sapui5
relations:
  affects:
    - modes/legacy
    - modes/batch
---
# `--ui5`

UI5 url.

## Overview

| | |
|---|---|
| Type | [`url`](types/url.md) |
| Default | `'https://ui5.sap.com'` |
| Config key | `ui5` |
| Propagates to batch items | yes |

## Details

Use this option to select which version of UI5 should be used by the internal server. The URL should point to the root of the UI5 distribution, including any version path segment (e.g. `https://ui5.sap.com/1.120.0`).

This option only applies in legacy mode, where the runner owns the `/resources/` proxy. In remote mode the tested page controls its own UI5 loading and this setting is ignored.

## Example

```bash
ui5-test-runner --ui5 https://ui5.sap.com/1.120.0
ui5-test-runner --ui5 https://sapui5.hana.ondemand.com/1.108.0
```
