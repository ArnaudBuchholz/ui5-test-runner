---
"#type": concept
title: Selenium WebDriver driver
summary: The v6 Selenium WebDriver driver — an in-process automation library using WebDriver BiDi; Chrome is wired today, Firefox/Edge/Safari are declared but not yet launched
keywords:
  - selenium-webdriver
  - chrome
  - bidi
  - driver
relations:
  see-also:
    - options/driver
    - options/browser
    - options/seleniumApiTimeout
    - options/pageTimeout
    - browsers/v6/browser
    - browsers/v6/browsers/chrome
    - browser_selection
---
# `selenium-webdriver` driver

Select with `--driver selenium-webdriver`. The
[selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver) library is
loaded in-process and drives the browser over the WebDriver protocol.

## Supported browsers

| `--browser` | Status | Notes |
|---|---|---|
| `chrome` | ✔️ wired today | default when `--browser` is omitted |
| `firefox` | 🚧 declared / not yet launched | accepted value; driver currently launches Chrome only |
| `edge` | 🚧 declared / not yet launched | accepted value; driver currently launches Chrome only |
| `safari` | 🚧 declared / not yet launched | accepted value; driver currently launches Chrome only |

> The driver **validates** `firefox`/`edge`/`safari` as accepted values, but the
> current implementation always launches Chrome. Treat those as planned.

## Particularities

* Uses WebDriver **BiDi** (BiDi log inspector, browsing-context, script and
  network modules) for console and network capture.
* Chrome arguments (`UI5TR_CHROME_ARGS`) are passed into the Chrome `Options` —
  see [Chrome / Chromium specifics](browsers/chrome.md).
* Requires a matching browser driver binary installed locally; see the
  [selenium-webdriver installation notes](https://www.npmjs.com/package/selenium-webdriver#installation).

## Session expiry detection

Selenium Grid and containerised Selenium nodes have a server-side session timeout
(`SE_NODE_SESSION_TIMEOUT`, default 300 s). When it fires, the browser closes
silently. Because `eval` and `screenshot` calls go over plain HTTP with no
built-in timeout, the runner would otherwise hang until the global timeout (which
can be tens of minutes).

To detect this quickly, every `eval` and `screenshot` call is raced against
[`--selenium-api-timeout`](options/seleniumApiTimeout.md) (default 10 s). When a
call does not respond in time, the affected page is immediately failed with:

```
Selenium WebDriver API call did not respond within Xms — the session may have expired
```

Because all pages share one Selenium session, every page running at the time
will fail independently as each hits the same timeout.

### Mitigations

| Goal | Approach |
|---|---|
| Prevent expiry during a long test page | Increase `SE_NODE_SESSION_TIMEOUT` on the Grid / container beyond the expected page duration |
| Fail pages before the session can expire | Set [`--page-timeout`](options/pageTimeout.md) shorter than `SE_NODE_SESSION_TIMEOUT` |
| Reduce exposure | Split long OPA suites into smaller pages so each completes well within the session window |
