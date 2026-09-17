# Browser Selection Design

## Overview

The CLI separates two orthogonal concerns into two flags:

- **`--driver`/`-d`** — the automation library (`puppeteer`, `playwright`, `webdriverio`, `selenium-webdriver`). Default: `puppeteer`.
- **`--browser`/`-b`** — the actual browser to launch (`chrome`, `chromium`, `firefox`, `webkit`, `edge`, `safari`). Default: driver's default (see table below).
- **`--browser-options`** — JSON blob of browser-specific launch options (e.g. `{"args":["--lang=fr-FR"]}`). Default: `{}`.

## Supported driver/browser combinations

| Driver | Supported browsers | Default |
|---|---|---|
| `puppeteer` | `chrome`, `firefox` | `chrome` |
| `playwright` | `chromium`, `firefox`, `webkit` | `chromium` |
| `webdriverio` | `chrome`, `firefox`, `edge`, `safari` | `chrome` |
| `selenium-webdriver` | `chrome`, `firefox`, `edge`, `safari` | `chrome` |

An unsupported `(driver, browser)` pair is rejected at config-validation time with a clear error message.

## Validation

1. **Type validation** — `--browser` uses the `enumeration` option type; off-list values (e.g. `safri`) are rejected immediately.
2. **Per-driver validation** — a `punyexpr` rule in `src/configuration/validations.ts` (generated from `docs/options/browser.md`) rejects valid-browser-name but wrong-driver combinations (e.g. `--driver puppeteer --browser safari`).
3. **JSON validation** — `--browser-options` uses the `json` option type; malformed JSON is rejected with a parse error.

## Static driver descriptor

Each driver module exports a `descriptor: BrowserDriverDescriptor` with:

- `supportedBrowsers` — list of valid browser names for that driver
- `defaultBrowser` — the browser used when `--browser` is omitted
- `screenshotFormat` — file extension for screenshots (`.png` for all drivers today)

`getDescriptor(driver)` from `src/browsers/factory.ts` is the single access point.

## Runtime flow

1. `setupBrowser` reads `configuration.driver` to select the factory.
2. It calls `getDescriptor(driver).defaultBrowser` to resolve the browser when `--browser` is omitted.
3. `BrowserSettings.browser` and `BrowserSettings.options` carry the resolved values into the driver's `setup()` call.
4. The driver interprets them (today: only puppeteer implements full browser selection; other drivers default to chrome).

## Puppeteer specifics

- Passes `browser: 'chrome' | 'firefox'` in puppeteer launch options.
- Merges `settings.options.args` (string array) into the `args` array.
- Auto-installs the target browser via `npx puppeteer browsers install <target>` on first run.

## Future work

Real browser selection for `playwright`, `webdriverio`, and `selenium-webdriver` — tracked per driver in `docs/browsers/<driver>.md`.
