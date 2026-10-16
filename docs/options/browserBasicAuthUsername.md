---
"#type": option
title: browserBasicAuthUsername
type: string
summary: username for HTTP basic authentication
keywords:
  - capabilities
relations:
  see-also:
    - options/browserBasicAuthPassword
    - options/driver
validation:
  - message: "browserBasicAuthUsername is only supported with puppeteer and playwright drivers"
    conditions:
      - "driver === 'puppeteer' || driver === 'playwright'"
  - message: "browserBasicAuthUsername requires browserBasicAuthPassword"
    conditions:
      - "browserBasicAuthPassword !== undefined"
---
# `--browser-basic-auth-username`

Username for HTTP basic authentication.

## Overview

| | |
|---|---|
| Type | [`string`](types/string.md) |
| Default | *none* |
| Config key | `browserBasicAuthUsername` |

## Details

Use together with [`--browser-basic-auth-password`](browserBasicAuthPassword.md) to authenticate against pages protected by HTTP basic authentication. Only supported with the `puppeteer` and `playwright` drivers.

## Example

```bash
ui5-test-runner --driver puppeteer --browser-basic-auth-username myuser --browser-basic-auth-password mypassword --url http://host/test/testsuite.qunit.html
```
