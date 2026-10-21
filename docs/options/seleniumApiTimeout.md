---
"#type": option
title: seleniumApiTimeout
type: timeout
summary: fails a page if a selenium webdriver api call does not respond within this timeout, indicating a dead session
default: "10000"
keywords:
  - selenium-webdriver
  - timeout
  - session
relations:
  see-also:
    - options/pageTimeout
    - browsers/v6/selenium_webdriver
---
# `--selenium-api-timeout`

Fails a page if a Selenium WebDriver API call does not respond within this timeout, indicating a dead session.

## Overview

| | |
|---|---|
| Type | [`timeout`](types/timeout.md) |
| Default | `10000` |
| Config key | `seleniumApiTimeout` |

## Details

When using the `selenium-webdriver` driver, each `eval` and `screenshot` call is made over the WebDriver HTTP protocol with no built-in timeout. If the Selenium session expires server-side (e.g. `SE_NODE_SESSION_TIMEOUT` on a Selenium Grid or Docker container), the browser closes silently and subsequent calls hang indefinitely.

This option races every `eval` and `screenshot` call against the given timeout. If the call does not complete in time, the page is failed immediately with the message:

```
Selenium WebDriver API call did not respond within Xms — the session may have expired
```

Each affected page fails independently with that message. The remaining pages in the run also fail as they each hit the same timeout.

## Mitigations

- Set `SE_NODE_SESSION_TIMEOUT` on the Selenium Grid or container to a value larger than the expected duration of your longest test page.
- Set [`--page-timeout`](./pageTimeout.md) to a value shorter than `SE_NODE_SESSION_TIMEOUT` so pages complete and close before the session can expire.
- Split long OPA test suites into smaller pages so each page completes well within the session window.

## Example

```bash
ui5-test-runner --selenium-api-timeout 10000
ui5-test-runner --selenium-api-timeout 10s
```
