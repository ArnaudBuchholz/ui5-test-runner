# ADR-0013: Browser Selection Architecture

## Status
Accepted

## Context

Before this ADR, the `--browser` option named the **automation driver** (`puppeteer`, `playwright`, `webdriverio`, `selenium-webdriver`), and every driver hardcoded Chrome/Chromium. Users could not select the actual browser (firefox, webkit, edge, safari) nor pass browser-specific launch options. The two concerns — **which automation library** and **which browser** — were conflated into a single option.

## Decision

### Two explicit CLI flags

`--driver`/`-d` names the automation library (was `--browser`); `--browser`/`-b` names the actual browser. `--browser` changes meaning at v6, which is a breaking release.

```
--driver, -d <driver>       default: puppeteer
--browser, -b <browser>     default: (driver's default browser)
--browser-options <json>    default: {}
```

`--browser` omitted → resolved to the driver's default at runtime. Unknown browser, per-driver-invalid `(driver, browser)`, and malformed `--browser-options` all fail at config-validation time.

### Generic `json` option type

`--browser-options` uses a new generic `json` validator type (`src/configuration/validators/json.ts`) that parses a JSON string → `Record<string, unknown>`, passes through an already-object config-file value, and throws `OptionValidationError.createConfigInvalidJson` on parse failure. This avoids a bespoke browser-options type.

### `enumeration` + option-level `validation` for per-driver validity

`--browser` uses the existing `enumeration` type. Its `typeModifiers` is the union of all drivers' browsers (chrome, chromium, firefox, webkit, edge, safari), so it rejects genuinely-unknown values at the type-validation step.

Per-driver validity (e.g. reject `--driver puppeteer --browser safari`) is enforced by the existing option-level `validation` mechanism: a `punyexpr` rule in the option's doc frontmatter, generated into `src/configuration/validations.ts`. This keeps the supported-browser matrix in doc frontmatter, separate from but synchronised with each driver's `BrowserDriverDescriptor.supportedBrowsers`.

### Static `BrowserDriverDescriptor`

Each driver exports a top-level `descriptor: BrowserDriverDescriptor` with:

- `supportedBrowsers: readonly string[]`
- `defaultBrowser: string`
- `screenshotFormat: string` (moved up from `BrowserCapabilities`)

`screenshotFormat` was removed from `BrowserCapabilities` — it is a per-driver constant, never runtime-dynamic. `factory.ts` exports `getDescriptor(driver)` for consumers needing format or default-browser at config time.

### `BrowserSettings` extended

Two fields added to `BrowserSettings`:

- `browser?: string` — resolved actual browser; `undefined` falls back to `descriptor.defaultBrowser`
- `options?: Record<string, unknown>` — parsed `--browser-options`

`IBrowser`/`IWindow` method signatures are unchanged.

### Puppeteer as the working prototype

Puppeteer implements the full browser-selection path: `browser` field in launch options, `args` merged from `settings.options.args`, auto-install of the target browser on first run. Other drivers keep chrome-only behaviour for now; real browser selection is a follow-up per driver.

## Consequences

- `--browser` now means the actual browser, not the driver — breaking at v6 (intended).
- `--driver` is the new name for the automation library.
- Adding browser support for a new driver requires: updating the driver's `descriptor.supportedBrowsers`, updating the `browser` option's `validation` condition in `docs/options/browser.md`, and implementing the launch logic in the driver.
- The supported-browser matrix is stated in two places (doc frontmatter and each `descriptor.supportedBrowsers`) — they must be kept in sync.

## Rejected Alternatives

- **Combined token** (`puppeteer:firefox`): complex parsing, bad discoverability.
- **`BrowserCapabilities.supportedBrowsers`**: runtime-dynamic is wrong; this is a static per-driver property.
- **`device` option**: no mobile/DPR/touch plumbing exists anywhere in the codebase; adding it would invent an unrequested feature.
