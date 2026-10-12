---
"#type": option
title: url
short: u
type: url
multiple: yes
summary: URL of the page to test
keywords:
  - page
  - endpoint
  - address
relations:
  affects:
    - modes/remote
---
# `--url` / `-u`

URL of the page to test.

## Overview

| | |
|---|---|
| Type | [`url`](types/url.md) |
| Multiple | yes |
| Default | *none* |
| Config key | `url` |
| Short flag | `-u` |

## Details

Setting this option activates remote mode: the runner connects to already-running pages rather than starting a local server. The option can be repeated to test multiple pages in parallel.

When `--url` is set, `--testsuite` is ignored.

If the URL contains port `0` (e.g. `http://localhost:0/test/page.html`), it is replaced at runtime with the port actually allocated by the runner's internal server.

## Example

```bash
ui5-test-runner --url http://localhost:8080/test/page.qunit.html
ui5-test-runner -u http://host/test/a.qunit.html http://host/test/b.qunit.html
```
