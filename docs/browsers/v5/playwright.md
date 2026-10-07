---
"#type": concept
title: playwright (v5)
summary: "v5: legacy Playwright browser instantiation command ($/playwright.js). Kept for migration; see the v6 playwright driver for the current model"
keywords:
  - playwright
  - chromium
  - firefox
  - webkit
  - driver
relations:
  breaking-in:
    - v6
  see-also:
    - browsers/v5/browser
    - browsers/v6/playwright
---

# playwright

## Capabilities

| `--browser` | `$/playwright.js` |
|---|---|
| Module | [playwright](https://www.npmjs.com/package/playwright) |
| Screenshots | ✔️ `.png` |
| Scripts | ✔️ |
| Traces | `console`, `network` |

Browser selection is done by passing browser parameters. For instance :

`ui5-test-runner --browser $/playwright.js -- --browser chromium`

Supported browsers :

* chromium
* firefox
* webkit

## Options

```text
  -b, --browser <name>            Browser driver (default: "chromium")
  --visible [flag]                Show the browser (default: false)
  -w, --viewport-width <width>    Viewport width (default: 1920)
  -h, --viewport-height <height>  Viewport height (default: 1080)
  -l, --language <lang...>        Language(s) (see rfc5646) (default:
                                  ["en-US"])
  -u, --unsecure                  Disable security features (default: false)
  -v, --video                     Record video (default: false)
  -n, --har                       Record network activity with har file
                                  (default: false)
```

## Implementation notes

* If you use the video recording feature (`--video`), it is recommended to turn off the screenshots as it makes the screen flicker
* In the latest version, playwright requires an additional installation step (`npx playwright install`). The command executes it.
