---
"#type": option
title: isolation
type: enumeration
summary: per-page browser isolation strategy
keywords:
  - browser
  - capabilities
batchForwarded: yes
default: "'none'"
browserExposed: yes
typeModifiers:
  - none
  - context
validation:
  - message: "isolation 'context' is supported by puppeteer and playwright only"
    conditions:
      - "isolation !== 'context' || driver === 'puppeteer' || driver === 'playwright'"
relations:
  requires:
    - options/driver
  see-also:
    - options/parallel
---
# `--isolation`

Per-page browser isolation strategy.

## Overview

| | |
|---|---|
| Type | [`enumeration`](types/enumeration.md) |
| Values | `none` \| `context` |
| Default | `'none'` |
| Config key | `isolation` |
| Propagates to batch items | yes |

## Details

Controls how each test page is isolated from the others within the browser.

- `none` *(default)* — each page runs in its own tab of a single shared browser process, with no
  isolation between pages. Tabs share the process HTTP cache and, depending on origin partitioning,
  cookies and storage. This is the historical behavior.
- `context` — each page runs in a dedicated browser context, giving it a fresh
  cookie/storage/cache jar with no cross-page state bleed. This reduces flakiness caused by
  shared state at a much lower cost than launching a separate browser per page.

In `none` mode, when `parallel` is greater than 1, the injected agent replaces `window.localStorage`
with a per-page in-memory shim so that pages sharing the one browser context do not clobber each
other's `localStorage`. Under `context` the browser context already isolates `localStorage`, so the
shim is not installed and the native `localStorage` is used.

`context` is only supported by the `puppeteer` and `playwright` drivers; combining it with
`selenium-webdriver` or `webdriverio` is rejected.

## Example

```bash
ui5-test-runner --isolation context
```
