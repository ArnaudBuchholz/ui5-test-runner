---
"#type": concept
title: Dependency management
summary: How the runner auto-installs browser drivers, browser binaries, and coverage tooling at runtime, the security risks that introduces, and how to use your own pre-installed dependencies instead
keywords:
  - npm
  - install
  - dependencies
  - driver
  - puppeteer
  - playwright
  - nyc
  - security
  - lockfile
  - postinstall
  - supply chain
  - noNpmInstall
relations:
  see-also:
    - options/noNpmInstall
    - options/npmInstall
    - options/npmInstallPrefix
    - options/npmInstallMinReleaseAge
    - options/npmAllowInstallScripts
    - options/alternateNpmPath
    - browsers/v6/browser
    - coverage
    - security
---
# Dependency management

## What the runner installs automatically

ui5-test-runner depends on three categories of package that it does not bundle:

| Category | Examples | When needed |
|---|---|---|
| **Browser driver** | `puppeteer`, `playwright`, `webdriverio`, `selenium-webdriver` | Always — the runner needs an automation library to open browsers |
| **Browser binary** | Chromium (bundled with Puppeteer), Chrome, Firefox | Depends on driver — Puppeteer downloads Chromium on install; others expect the browser pre-installed |
| **Coverage tooling** | `nyc` | Only when `--coverage` is enabled |

At startup, the runner checks whether each required package is resolvable from the working directory. If a package is missing, it installs it automatically using npm before continuing.

## Install strategies

The `--npmInstall` option controls where the runner installs missing packages:

| Strategy | npm invocation | When to use |
|---|---|---|
| `global` *(default)* | `npm install -g <pkg>` | Shared across projects on the same machine |
| `local` | `npm install --no-save <pkg>` | Installed into the project's `node_modules` without touching `package.json` |
| `prefix` | `npm install --prefix <path> <pkg>` | Installed into a specific directory set by [`--npmInstallPrefix`](./options/npmInstallPrefix.md) — useful for isolated environments or shared caches across projects |

### Package lookup order

Before installing anything, the runner checks whether a package is already available by searching paths in this order:

1. local
2. global
3. alternate — the path set by [`--alternate-npm-path`](./options/alternateNpmPath.md), if specified
4. prefix — the path set by [`--npmInstallPrefix`](./options/npmInstallPrefix.md), if specified

Only if the package is not found in any of these locations does the runner proceed to install it.

## Security risks of auto-installation

Auto-installation is convenient for quick starts but introduces two security risks that matter in production and CI environments.

### Supply-chain risk: auto-install bypasses your lockfile

When the runner installs a package at runtime, it fetches the latest version that satisfies the range from the registry — it does **not** consult your project's `package-lock.json` or `npm-shrinkwrap.json`. A newly published package version (including a compromised one) can be pulled in on any run without any change to your repository.

The [`--npmInstallMinReleaseAge`](./options/npmInstallMinReleaseAge.md) option mitigates this by refusing to install packages published fewer than `N` days ago (default: 3 days). This makes a freshly-injected malicious package less likely to be installed immediately, but it is not a substitute for a pinned lockfile.

### Execution risk: postinstall scripts run arbitrary code

By default, the runner passes `--ignore-scripts` to npm during auto-installation, so `postinstall` scripts in the installed package do **not** run. This is a safe default.

If you set [`--npmAllowInstallScripts`](./options/npmAllowInstallScripts.md), postinstall scripts are allowed to execute. Those scripts run with the same privileges as the runner process and can perform any operation the current user can perform. Only enable this option when you trust the packages being installed.

## The safer approach: provide your own dependencies

The most secure and reproducible setup is to install all required packages yourself, before the runner starts, so auto-installation never occurs.

**1. Add the driver (and nyc if using coverage) to your project's `devDependencies`:**

```bash
# Example with Puppeteer and coverage
npm install --save-dev puppeteer nyc
```

**2. Commit the updated `package-lock.json`.** This pins the exact versions under your project's lockfile and subjects them to your normal dependency-review process.

**3. Disable auto-installation with `--no-npm-install`:**

```bash
ui5-test-runner --no-npm-install --url http://localhost:8080/test/testsuite.qunit.html
```

With this flag, the runner will not attempt to install anything at runtime. If a required package is missing, the run fails immediately with a clear error rather than silently pulling a package from the registry.

**4. In CI, ensure `npm ci` (or equivalent) runs before the test step.** `npm ci` installs exactly what is in the lockfile, giving you a fully deterministic environment.

### Summary: auto-install vs. pre-install

| | Auto-install (default) | Pre-install + `--no-npm-install` |
|---|---|---|
| Setup effort | None | Add packages to `devDependencies`, run `npm install` |
| Version pinning | No — installs latest at runtime | Yes — exact versions in lockfile |
| Postinstall scripts | Blocked by default | Controlled by your normal install |
| Reproducibility | Runs may differ as packages publish | Identical across machines and runs |
| Recommended for CI | ⚠️ Use with caution | ✅ Preferred |
