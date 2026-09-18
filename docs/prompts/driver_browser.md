# Browser selection & browser-specific options — implementation plan

> Execute step by step, **in order**. After steps that touch `docs/options/**`
> or `build/options.mjs`, run `make options` and confirm it exits 0 before
> continuing. Never hand-edit `src/configuration/options.ts`,
> `src/configuration/validations.ts`, or `src/agent/Configuration.ts` — they are
> generated.

## Context

Today the `--browser` option names the **automation driver** (`puppeteer`,
`playwright`, `webdriverio`, `selenium-webdriver`), and every driver launches a
**hardcoded Chrome/Chromium** (`src/browsers/*.ts` all pass a fixed chrome
config to `setup()`). Users cannot select the actual browser (firefox, webkit,
edge, safari) nor pass browser-specific launch options (Chrome CLI args, Firefox
prefs). The abstract launch contract `BrowserSettings`
(`src/browsers/IBrowser.ts:7-13`) carries only `visible`/`viewport`/`language`/
`secure`/`basicAuthentication`.

v6 is a major, breaking release, so we take the clearest interface: split the
two orthogonal axes — **driver** and **browser** — into two explicit flags, add
a generic `--browser-options` JSON passthrough, and make each driver the
*authority* on which browsers it supports (via a static, dependency-free
`descriptor`) and how it maps the browser/options into its launch call. The full
path is implemented for **puppeteer** as a working prototype; the other drivers
get the descriptor + settings plumbed with chrome-only behavior as a documented
follow-up (no regression).

**Agreed decisions:**
1. **Two flags.** `--driver`/`-d` (automation library, was `--browser`);
   `--browser`/`-b` (actual browser). `--browser` changes meaning — acceptable
   at v6.
2. **One `--browser-options` JSON blob**, using a **generic `json` option
   type** (not a browser-specific type). It parses JSON → `Record<string,unknown>`.
3. **Reuse existing option machinery — no bespoke types/validators for the
   browser axis:**
   - `--browser` uses the existing **`enumeration`** type. Its `typeModifiers`
     is the *union* of all drivers' browsers, so it rejects genuinely-unknown
     values (`safri`).
   - Per-driver validity (e.g. reject `--driver puppeteer --browser safari`) is
     enforced by the existing **option-level `validation` mechanism** — the
     `validation:` frontmatter key that `version`/`help`/`mcp`/`coverage` already
     use (`docs/options/version.md:6-10` → generated
     `src/configuration/validations.ts`, evaluated by `punyexpr` in
     `ConfigurationValidator.finalizeConfiguration`). No new validator type for
     the browser axis.
4. **`BrowserCapabilities` does not own `supportedBrowsers`** — dropped.
   `screenshotFormat` **moves up** to the static driver descriptor (it is a
   fixed per-driver constant, `.png` everywhere today, and is never read at
   runtime — `src/modes/test/report.ts:18-27` reads only `browserName`/
   `browserVersion`).
5. **No `device` option.** The only sizing concept in the codebase is
   `browserViewportWidth`/`Height` → `--window-size`. There is no mobile/DPR/
   user-agent/touch emulation plumbing anywhere (no option, no `BrowserSettings`
   field, no TODO), so a device option would be inventing an unrequested feature.
6. **IBrowser/IWindow method signatures stay unchanged.** New data lives only in
   `BrowserSettings` (inputs) and `BrowserCapabilities` (outputs), plus the new
   static `BrowserDriverDescriptor`.

Keep `docs/design/browser-selection.md` in sync — it currently still describes
an earlier combined-token approach and an unqualified `json` type.

## CLI surface

```
--driver, -d <driver>       default: puppeteer
--browser, -b <browser>     default: (driver's default browser)
--browser-options <json>    default: {}
```

`--browser` omitted ⇒ resolved to the driver's default at runtime.
Unknown browser, per-driver-invalid `(driver, browser)`, and malformed
`--browser-options` all fail at **config-validation** time (before launch).

## Verified mechanics (rely on these; do not re-derive)

- **Options are generated** by `build/options.mjs` from `docs/options/*.md`, run
  via `make options`. Never hand-edit `src/configuration/options.ts`,
  `src/configuration/validations.ts`, or `src/agent/Configuration.ts`.
- **Type names are derived from validator filenames** (`build/options.mjs:14-20`)
  and the option's `type` wikilink is checked against that derived set
  (`:56`). `enumeration` and `json` therefore each need a
  `src/configuration/validators/<name>.ts` to exist. `enumeration.ts` already
  exists; `json.ts` is new (Step 3).
- **`enumeration` validates `value ∈ option.typeModifiers`**
  (`validators/enumeration.ts:4-9`); `typeModifiers` is generated from a
  frontmatter YAML array of wikilinks into `new Set([...] as const)`
  (`build/options.mjs:67-76`, `:134-135`). This is a generic mechanism, not
  enumeration-specific.
- **Option-level `validation` rules** (`build/options.mjs:92-96`, generated at
  `:172-194`): each `{ message, conditions }` becomes a `punyexpr` check run in
  `finalizeConfiguration` at depth 0. Conditions are AND-joined; the rule fires
  only when the option is present (`Object.hasOwn`) and throws
  `createValidationError` (`invalid use of <name>: <message>`) when the
  condition is false. **punyexpr supports** `===`/`!==`/`||`/`&&`/`!` and reads
  keys off the `configuration` object (it CANNOT call into driver modules), so
  the per-driver browser matrix is expressed as a static boolean string over
  `driver`/`browser` (see Step 4). This is the honest tradeoff of reusing the
  option-level mechanism: the supported-browser matrix is stated in the doc
  frontmatter, separate from each driver's `descriptor.supportedBrowsers` — keep
  the two in sync.
- **The agent-config type map throws on unknown types only for `browserExposed`
  options** (`build/options.mjs:152-167`, guarded by `if (option.browserExposed)`;
  knows only `boolean/browser/integer/timeout`). So `browser` (enumeration) and
  `browserOptions` (json) must **NOT** be `browserExposed` — the agent never
  reads them anyway.
- **`InferOptionType` needs a `json` arm** (`Option.ts:4-12`) → `Record<string,
  unknown>`, else it falls through to `string`. `enumeration` needs no arm
  (validator returns a `string`).
- **Validation runs progressively in array order**
  (`ConfigurationValidator.validate()`), but the per-driver `validation` rule
  runs in the separate `finalizeConfiguration` pass over the whole merged
  configuration, so `browser`/`driver` ordering within the type pass does not
  matter for it. `driver` has a default (`puppeteer`) so it is always present.

## Step 1 — Descriptor + capability types (`src/browsers/IBrowser.ts`)

```ts
export type BrowserSettings = {
  visible?: boolean;
  viewport?: { width: number; height: number };
  language?: string;
  secure?: boolean;
  basicAuthentication?: { username: string; password: string };
  browser?: string;                  // NEW: resolved browser; undefined = driver default
  options?: Record<string, unknown>; // NEW: parsed --browser-options
};

export type BrowserCapabilities = {
  browserName: string;
  browserVersion: string;            // screenshotFormat + supportedBrowsers removed
};

// NEW — static, dependency-free driver metadata read at config-validation time
export interface BrowserDriverDescriptor {
  supportedBrowsers: readonly string[];
  defaultBrowser: string;
  screenshotFormat: string;          // moved up from BrowserCapabilities
}
```

## Step 2 — Add a `descriptor` to each driver + a registry (`src/browsers/factory.ts`)

- In each of `puppeteer.ts`, `playwright.ts`, `webdriverio.ts`,
  `seleniumWebdriver.ts`, export a top-level `descriptor: BrowserDriverDescriptor`
  ABOVE `factory`, importing NO heavy dependency:
  - puppeteer: `['chrome','firefox']`, default `chrome`, `.png`.
  - playwright: `['chromium','firefox','webkit']`, default `chromium`, `.png`.
  - webdriverio & selenium: `['chrome','firefox','edge','safari']`, default
    `chrome`, `.png`.
- Remove the hardcoded `screenshotFormat: '.png'` literal from each `setup()`
  return (`puppeteer.ts:53`, `playwright.ts:46`, `webdriverio.ts:87`,
  `seleniumWebdriver.ts:106`).
- In `factory.ts`, add a `descriptors: { [key in Browser]: BrowserDriverDescriptor }`
  registry parallel to `factories`, and export
  `getDescriptor = (driver: Browser) => descriptors[driver]`.
- **Confirm** importing a driver module for its `descriptor` does not eagerly
  load the automation lib (heavy imports live inside `factory` via `Npm.import`).
  If a cycle or eager load appears, move each descriptor to a sibling
  `*.descriptor.ts` and a `src/browsers/descriptors.ts` registry.

## Step 3 — Generic `json` option type

- `src/configuration/Option.ts`: add `'json'` to `OptionType`, and a
  `T extends 'json' ? Record<string, unknown>` arm to `InferOptionType` (before
  the `: string` fallback).
- `src/configuration/validators/json.ts` (new): `JSON.parse` the string value;
  on failure throw `OptionValidationError.createConfigInvalidJson(option, value,
  cause)` (reuse the existing config-JSON error idiom); if the value is already
  an object (config file), pass it through. Returns `Record<string, unknown>`.
- Register `json` in `src/configuration/validators/index.ts`.
- Optional `docs/options/types/json.md` prose for the wikilink.

## Step 4 — Doc-driven option changes, then `make options`

**4a. Rename `browser` → `driver`.** `docs/options/browser.md` →
`docs/options/driver.md`: `short: d`, keep `type: browser`
(this type validates the *driver* name incl. `$/foo.js`), `batchForwarded`,
`browserExposed`, `default: "'puppeteer'"`. Do NOT rename the `browser` **type**
or `validators/browser.ts`.

**4b. New `docs/options/browser.md`** (actual browser):
```yaml
---
"#type": option
short: b
type: enumeration
summary: browser selection (per driver)
batchForwarded: yes
typeModifiers:
  - chrome
  - chromium
  - firefox
  - webkit
  - edge
  - safari
validation:
  - message: "browser is not supported by the selected driver"
    conditions:
      - "!browser || (driver === 'puppeteer' && (browser === 'chrome' || browser === 'firefox')) || (driver === 'playwright' && (browser === 'chromium' || browser === 'firefox' || browser === 'webkit')) || ((driver === 'webdriverio' || driver === 'selenium-webdriver') && (browser === 'chrome' || browser === 'firefox' || browser === 'edge' || browser === 'safari'))"
---
```
(NO `default`, NO `browserExposed`.) The `enumeration` validator rejects
off-list values; the `validation` rule rejects per-driver-invalid pairs.
Verify the exact `punyexpr` operators against
`src/configuration/validations.ts` samples during implementation and keep the
matrix in sync with each `descriptor.supportedBrowsers`.

**4c. New `docs/options/browserOptions.md`:**
```yaml
---
"#type": option
type: json
summary: browser-specific options (JSON)
default: "'{}'"
batchForwarded: yes
---
```
(NO `browserExposed`.)

**Then run `make options`** and confirm exit 0 and: `driver` (short `d`, default
puppeteer), `browser` (short `b`, type `enumeration`, no default, the six
`typeModifiers`), `browserOptions` (type `json`, default `'{}'`); a generated
per-`browser` rule in `validations.ts`; `src/agent/Configuration.ts` has
`driver: string` (not `browser`), and neither `browser` nor `browserOptions`
appears there (not `browserExposed`).

## Step 5 — Runtime wiring (`src/modes/test/browser.ts`, `setupBrowser`)

- Remove the over-restrictive `assert(browser === 'puppeteer' || 'playwright')`.
- `BrowserFactory.build(configuration, configuration.driver)` (the factory's
  `Browser` union is the driver set — unchanged).
- Resolve and populate settings:
  ```ts
  const driver = configuration.driver as Browser;
  const settings: BrowserSettings = {
    visible: browserVisible || debugKeepBrowserOpen,
    viewport: { width: browserViewportWidth, height: browserViewportHeight },
    browser: configuration.browser ?? getDescriptor(driver).defaultBrowser,
    options: configuration.browserOptions // parsed Record<string,unknown>, default {}
  };
  ```
- Anything that read `capabilities.screenshotFormat` must now read
  `getDescriptor(driver).screenshotFormat` (grep confirmed no runtime reader
  today; update `factory.spec.ts:28` mock and any test asserting it).

## Step 6 — Puppeteer prototype (`src/browsers/puppeteer.ts`)

- In `launchAndInstallIfNeeded`: `const target = settings.browser ?? 'chrome'`
  (re-guard ∈ {chrome,firefox}); pass `browser: target` in `launchOptions`
  (puppeteer 25 supports `{ browser: 'chrome' | 'firefox' }`).
- Merge `const extraArgs = (settings.options?.args as string[] | undefined) ?? []`
  into the `args` array.
- On install-needed, install the matching target
  (`npx puppeteer browsers install ${target}`).
- Return `browserName: target` (or from `browser.version()`), `browserVersion`.

## Step 7 — Other drivers (no-regression plumbing)

`playwright.ts`, `webdriverio.ts`, `seleniumWebdriver.ts`: descriptor added in
Step 2; keep chrome-only launch for now, ignoring `settings.browser` beyond the
default. Note real-browser selection as a follow-up in
`docs/browsers/<driver>.md`.

## Step 8 — Tests & docs

- `src/configuration/validators/json.spec.ts`: valid JSON → object; bad JSON →
  `createConfigInvalidJson`; already-object pass-through; `'{}'` default.
- Extend `ConfigurationValidator.spec.ts` (or the validations spec): `--browser
  chrome` with `--driver puppeteer` passes; `--browser safari` + puppeteer →
  the per-driver validation error; off-list `--browser safri` → enumeration
  `invalid value`.
- Puppeteer descriptor + mapping spec (browser select + args merge).
- Update `factory.spec.ts:28` and any spec asserting `screenshotFormat` on
  capabilities; grep specs/fixtures asserting `--browser`/`browser` for the
  driver → `--driver`/`driver`. Follow repo test conventions.
- ADR `docs/adr/0013-browser-selection.md` (Accepted) + row in
  `docs/adr/index.md`: the driver/browser split, two-flag CLI, generic `json`
  options type, the static `BrowserDriverDescriptor`
  (supportedBrowsers/defaultBrowser/screenshotFormat), enumeration + option-level
  `validation` for per-driver validity, IBrowser/IWindow unchanged. Update
  ADR-0002 Configuration Options. Rewrite `docs/design/browser-selection.md` to
  this final design (drop combined-token + `supportedBrowsers`-on-capabilities).

## Verification

1. `make options` exits 0; `git diff src/configuration/options.ts
   src/agent/Configuration.ts src/configuration/validations.ts` shows only the
   rename + two new options + the per-browser validation rule.
2. Typecheck + vitest green.
3. End-to-end (puppeteer):
   - `--driver puppeteer` → chrome, unchanged.
   - `--driver puppeteer --browser firefox` → Firefox (installs first run);
     report `browserName` = `firefox`.
   - `--driver puppeteer --browser-options '{"args":["--lang=fr-FR"]}'` → arg
     reaches the browser.
   - `--browser safari` → config error (per-driver validation);
     `--browser safri` → enumeration invalid-value error;
     `--browser-options 'not-json'` → JSON parse error.
4. `--dump-config` shows `driver`, `browser`, `browserOptions` correctly.
