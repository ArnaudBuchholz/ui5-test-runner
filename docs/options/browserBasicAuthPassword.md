---
"#type": option
title: browserBasicAuthPassword
type: secret
summary: password for HTTP basic authentication
keywords:
  - capabilities
relations:
  see-also:
    - options/browserBasicAuthUsername
    - options/driver
validation:
  - message: "browserBasicAuthPassword is only supported with puppeteer and playwright drivers"
    conditions:
      - "driver === 'puppeteer' || driver === 'playwright'"
  - message: "browserBasicAuthPassword requires browserBasicAuthUsername"
    conditions:
      - "browserBasicAuthUsername !== undefined"
---
# `--browser-basic-auth-password`

Password for HTTP basic authentication. The value is never written to logs, reports, or `--dump-config` output.

## Overview

| | |
|---|---|
| Type | [`secret`](types/secret.md) |
| Default | *none* |
| Config key | `browserBasicAuthPassword` |

## Details

Use together with [`--browser-basic-auth-username`](browserBasicAuthUsername.md) to authenticate against pages protected by HTTP basic authentication. Only supported with the `puppeteer` and `playwright` drivers.

The password is stored as an opaque value and replaced with `***` in all serialized output (traces, CTRF report, `--dump-config`).

## Example

```bash
ui5-test-runner --driver puppeteer --browser-basic-auth-username myuser --browser-basic-auth-password mypassword --url http://host/test/testsuite.qunit.html
```
