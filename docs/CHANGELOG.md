# Changelog

All notable changes to [ui5-test-runner](https://github.com/ArnaudBuchholz/ui5-test-runner) are documented here.
Releases are listed in reverse chronological order (most recent first).

---

## [6.0.0-beta.5](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v6.0.0-beta.5) (2026-06-04) · pre-release

### Features

* new options to handle NPM package installation
* **npm:** working on dynamic installation

---

## [6.0.0-beta.4](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v6.0.0-beta.4) (2026-06-01) · pre-release

### Bug Fixes

* adjust cli command detection ([7c544d8](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/7c544d8daeb35cbc3258095eec9b5c40a60c0b35))

---

## [5.14.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.14.0) (2026-08-19)

### Bug Fixes

* update dependencies ([9bf9d3c](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/9bf9d3ca7a64dd6f6fd0673a7368379002c67b06))

### Features

* adjust test ([aea4d18](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/aea4d1858db8a0bb0b6f33f66800a860579ac373))
* allow emulating devices with puppeteer ([a97eac7](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/a97eac7b7c66c1cceee529b7b3b30166a7cb866a))

---

## [5.13.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.13.1) (2026-04-04)

### Bug Fixes

* pass environment variables to start command ([#171](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/171))

---

## [5.13.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.13.0) (2026-01-03)

### Bug Fixes

* clean handles in batch mode
* simplify killing of start command ([#157](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/157))

### Features

* add JSON report generator to create JSON format report

---

## [5.12.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.12.0) (2025-12-04)

### Bug Fixes

* `--if` option should be evaluated even for `--capabilities`
* `--if` must be allowed for capabilities to enable e2e tests filtering ([#163](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/163))
* `unref` start process to unblock the runner ([#157](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/157))

### Features

* enables generic library mapping — use `--libs *=webapp/resources` to map `resources/` sub folder ([#163](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/163))

---

## [5.11.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.11.2) (2025-11-28)

### Bug Fixes

* make sure UI5 mapping is used as expected, log version

---

## [5.11.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.11.1) (2025-11-21)

### Bug Fixes

* use proper concatenation to build final URL ([#160](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/160))

---

## [5.11.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.11.0) (2025-11-16)

### Bug Fixes

* added `--unsecure` flag for UI5 remote tests due to Chrome's local-network-access-check implementation
* adjusted Selenium's Chrome configuration with unsecure settings
* fixed handling of `browserArgs` parameter in configuration files
* implemented failover mechanism when unable to terminate processes ([#157](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/157))
* enhanced test compatibility for Windows and improved stability by waiting for process.exit events

### Features

* integrated screenshot capability into JUnit XML reports ([#158](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/158))

---

## [5.10.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.10.1) (2025-10-06)

### Bug Fixes

* compatibility with ESM projects ([#156](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/156))
* implement unsecure option for playwright

---

## [5.10.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.10.0) (2025-09-28)

### Bug Fixes

* absolute / relative path switch in report functionality
* allows sap-passport for CORS
* avoids infinite loop with `--deep-probe` when no testPageUrls extracted
* default label assignment in job processing
* report evaluation fix ensuring proper loading
* improved error reporting on startup
* enhanced handle documentation for leak detection
* improved start command termination
* limit the scope of QUnit hooks to the main window

### Features

* hidden option for handle monitoring
* setting for parallel probing capability
* jest2qunit wrapper adjustments
* report compression functionality
* deep probe capability
* child process error detection and reporting
* logo and OS information output
* experimental `--qunit-batch-size` option
* experimental fast qunit-hooks
* jest-to-QUnit adaptation script
* preference for `fetch` API over XMLHttpRequest
* Node.js version display in output

---

## [5.9.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.9.1) (2025-07-31)

### Bug Fixes

* include values for options to avoid `--no-screenshot` generating `--screenshot`

---

## [5.9.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.9.0) (2025-07-23)

### Bug Fixes

* detect and filter out empty browser arguments

### Features

* introduce 'Empty browser argument filtered out' warning
* keep track of command line arguments and config file content

---

## [5.8.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.8.1) (2025-06-23)

### Bug Fixes

* bump REserve to 2.3.3 to limit listeners on requests' sockets

---

## [5.8.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.8.0) (2025-06-20)

### Bug Fixes

* improve detection on non TTY console

### Features

* new `--ci` option to force output to non interactive

---

## [5.7.4](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.7.4) (2025-06-16)

### Bug Fixes

* secure generation of junit-xml-report

---

## [5.7.3](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.7.3) (2025-06-15)

### Bug Fixes

* forcibly close REserve and wait for handles to be released

---

## [5.7.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.7.2) (2025-06-07)

### Bug Fixes

* **capabilities:** handle case where parent window is simulated (happy-dom)
* **capabilities:** proper logging of errors
* detect leaking TLS sockets that prevents runner termination
* handle new punyexpr export format ([#136](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/136))
* increase default end timeout
* **jsdom:** also handles jsdomError
* **jsdom:** restores jsdom compatibility ([#137](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/137))

### Features

* add traces during report generation
* asynchronous check for latest version no longer impacts startup time, also checks ui5-test-runner itself

---

## [5.7.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.7.1) (2025-05-21)

### Bug Fixes

* disable tests for JSDOM ([1206798](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/1206798a06ebc3562919f459842299d5c22fed90))
* use old version of punyexpr ([#136](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/136)) ([1559991](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/1559991a02ab0dfda329a5aa893a61d2aefffc9c))

---

## [5.7.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.7.0) (2025-04-18)

### Bug Fixes

* add missing mapping for log levels
* undefined is converted to a unicode character to avoid failure

### Features

* enables the override of localhost hostname

---

## [5.6.3](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.6.3) (2025-04-18)

### Bug Fixes

* do not stop the server while watching ([#134](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/134))

---

## [5.6.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.6.2) (2025-03-24)

### Bug Fixes

* ensure libs internal redirection url is absolute ([4c4ce0f](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/4c4ce0fb4790c60d3a24dc2890bba8d6fe428513))

---

## [5.6.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.6.1) (2025-03-20)

### Bug Fixes

* maps local libraries to webapp for coverage ([#106](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/106))
* corrects a typo in job status ([#133](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/133))
* wraps coverage threshold error handling ([#132](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/132))

---

## [5.6.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.6.0) (2025-03-18)

### Features

* **env:** `--env` flag added to set environment variables ([#129](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/129))
* enables override of the callback host configuration ([#131](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/131))

---

## [5.5.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.5.2) (2025-03-16)

### Bug Fixes

* resolves an issue where the main command fails when a batch item fails ([#127](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/127))
* corrects handling of the node command on Windows systems
* fixes a timeout issue causing tests to fail even when the page had not started ([#111](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/111))

---

## [5.5.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.5.1) (2025-03-13)

### Bug Fixes

* condition done screenshot on `--screenshot` ([#126](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/126)) ([08ebb92](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/08ebb924))
* disable language testing ([#128](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/128)) ([66a307f](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/66a307ff))

---

## [5.5.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/v5.5.0) (2025-03-08)

### Bug Fixes

* **batch:** change the way the option is handled ([88eb57d](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/88eb57dc))
* **batch:** normalize file name to work on Windows transparently ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([afc2bf4](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/afc2bf41))
* `--language` browser option ([#122](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/122)) ([50f6690](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/50f6690e))
* change network icon ([2df4ef5](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/2df4ef55))
* change status label ([37d698b](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/37d698b1))
* ensure fileHandle is a valid one ([6494830](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/64948307))
* introducing `JUNIT_XML_REPORT_FILENAME` ([#121](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/121)) ([c9d4b28](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/c9d4b28c))
* normalize path ([de57d9b](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/de57d9ba))
* take into account the batch mode icon ([9b45094](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/9b450945))

### Features

* **batch:** forward parameters that makes sense ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([a294f31](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/a294f318))
* **batch:** implement scanning on a regular expression ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([fad5719](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/fad57191))
* **batch:** initial implementation ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([bbe1fb8](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/bbe1fb8e))
* **batch:** output warning in case of error ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([686afef](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/686afef8))
* **batch:** override report-dir only if specified in main command ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([ecb59b6](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/ecb59b60))
* **batch:** supports multiple configuration files ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([40f05a2](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/40f05a20))
* **coverage:** warn when coverage is missing ([b7a03b9](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/b7a03b90))
* **end:** enables the end script ([b5fc272](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/b5fc2728))
* **end:** implement end script ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([ee26567](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/ee265671))
* **if:** implement execution condition ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([85ee8a4](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/85ee8a4b))
* **job:** exposes `--config` parameter to specify a configuration file ([6d40bc0](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/6d40bc02))
* **job:** when config is set, cwd is defaulted to folder of configuration ([ac6f298](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/ac6f298c))
* **patch:** generate stdout & stderr files for when something goes wrong ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([583aa54](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/583aa54b))
* **start:** accepts `--start-wait-url` to enable in every mode ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([fc110fd](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/fc110fd5))
* **start:** allows method specification — replace node command with node path ([75736f7](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/75736f71))
* **start:** start command triggered before running the server ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([585d658](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/585d6584))
* **watch:** enables `--watch-folder` ([#119](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/119)) ([6ec0f78](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/6ec0f789))
* adds declaration for end command ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([abf9a2c](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/abf9a2ca))
* batch mode related options ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([a731b45](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/a731b45f))
* enables the use of port 0 in URLs to bind automatically to runner's server ([#105](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/105)) ([866f4ce](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/866f4ce2))
* exposes `--screenshot-on-failure` with the proper default ([#102](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/102)) ([129e30e](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/129e30e5))

---

## [5.4.3](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.4.3) (2025-01-28)

### Bug Fixes

* **chrome:** extra parameter required in some scenarios, side effect of ([#116](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/116)) ([f4919e8](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/f4919e87))

---

## [5.4.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.4.2) (2025-01-24)

### Bug Fixes

* re-enable screenshot since it was addressed in webdriverio@9.7.0 ([#117](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/117))

---

## [5.4.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.4.1) (2025-01-24)

### Bug Fixes

* **webdriverio:** disable screenshot because of webdriverio bug ([#117](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/117)) ([c0c20aa](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/c0c20aa1))
* **job:** `--no-` parameters are not reading configuration file value ([81f1d83](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/81f1d839))

### Features

* **job:** enable `screenshotTimeout` for capabilities mode ([60b0312](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/60b0312b))
* **output:** adds support of `*` in `--debug-verbose` ([78b5f66](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/78b5f661))

---

## [5.4.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.4.0) (2025-01-20)

### Bug Fixes

* use standard `.nycrc.json` file name instead of `nyc.json`, document missing dependency ([#110](https://github.com/ArnaudBuchholz/ui5-test-runner/pull/110)) ([140c61a](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/140c61a1))
* fix deserialization of configuration files which generates extra parameters ([#109](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/109)) ([ba06c9d](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/ba06c9df))
* **output:** improve logging for errors ([f49049c](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/f49049c))

### Features

* **start:** raw implementation of `--start` command for `remote` mode ([#112](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/112)) ([d74f1a1](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/d74f1a17))

---

## [5.3.7](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.3.7) (2024-12-01)

### Bug Fixes

* replace qunit-intercept mechanism ([#107](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/107))
* exclude ui5-focus test for JSDOM

---

## [5.3.6](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.3.6) (2024-11-21)

### Bug Fixes

* **junit-xml-report:** support missing message in log ([a236178](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/a2361782))

---

## [5.3.5](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.3.5) (2024-11-15)

### Bug Fixes

* fix typo in type detection for pages with no tests ([64f1be3](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/64f1be38))
* ensure path does not end with trailing separator ([2ff294a](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/2ff294a6))

### Features

* dump reserve configuration on verbose mode ([a4678ff](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/a4678ff0))
* includes Node 22 in the test grid ([3611bc7](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/3611bc78))

---

## [5.3.4](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.3.4) (2024-09-17)

### Bug Fixes

* backup XMLHttpRequest before it is replaced by Sinon.js ([#101](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/101)) ([5aa880c](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/5aa880c5))

---

## [5.3.3](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.3.3) (2024-09-03)

### Bug Fixes

* **coverage:** do not collect coverage data if coverage is not enabled ([dcfedd9](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/dcfedd9f))
* **ui5:** adjust libs mapping to compensate for REserve2 strict checking, add debug traces for mappings ([#99](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/99)) ([a4651e5](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/a4651e5f))

---

## [5.3.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.3.2) (2024-08-20)

### Bug Fixes

* remove content-length header ([#98](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/98)) ([1f6ac85](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/1f6ac857))

---

## [5.3.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.3.1) (2024-07-04)

### Bug Fixes

* **post:** remembers initial URL ([#96](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/96)) ([e56a35b](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/e56a35bf))
* **qunit-hooks:** filters out unwanted modules ([#96](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/96)) ([ecc523e](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/ecc523ec))
* **qunit-hooks:** handles QUnit v1 change of URL ([7e2af45](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/7e2af454))
* **probe:** handle QUnit v1 modules ([#96](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/96)) ([7e2af45](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/7e2af454))
* **e2e:** 10 minutes timeout ([#97](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/97)) ([743d801](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/743d8013))

---

## [5.3.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.3.0) (2024-06-28)

### Bug Fixes

* **qunit:** handle fake QUnit object that can be set before QUnit is loaded ([#95](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/95)) ([84c0dce](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/84c0dce0))
* **coverage:** nyc changed interface for instrumenter ([c0bdb71](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/c0bdb715))
* safer detection of UI5 objects ([#92](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/92)) ([f39e213](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/f39e2130))

### Features

* **chores:** update reserve ([#94](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/94)) ([41186dd](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/41186ddf))

---

## [5.2.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.2.0) (2024-06-10)

### Features

* **browsers:** unify options ([c386661](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/c386661c))
* **docs:** enable additional text after options ([159a779](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/159a7790))

---

## [5.1.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.1.0) (2024-06-06)

### Bug Fixes

* **jsdom:** fix incompatible case sensitive querySelector ([eeeda02](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/eeeda02e))
* **job:** allow `browserRetry` for capabilities ([6559203](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/65592033))
* **reserve2:** always deserialize as JSON ([3d3b4f2](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/3d3b4f2a))
* **reserve2:** JS_REMOTE_BASIC_AUTHENT ([cc4bf02](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/cc4bf026))
* **reserve2:** adjust post headers ([ea9be04](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/ea9be04a))
* **reserve2:** adjust file mappings ([99ba770](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/99ba7708))
* **reserve2:** absolute path are forbidden ([1c91697](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/1c916978))
* **reserve2:** if-match ([1a15167](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/1a15167a))
* **reserve2:** update of body API ([b8de31f](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/b8de31f4))

### Features

* **jsdom:** more traces ([d086f15](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/d086f15a))
* **jsdom:** multiplex traces through stdout ([33f7173](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/33f7173d))
* **reserve:** disable static mode for file handler when in watch mode or debug-dev-mode ([5704af2](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/5704af29))
* **coverage:** ensure the use of absolute paths in the coverage report ([e4bd881](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/e4bd8114))
* **reserve2:** starting migration ([b4f51fb](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/b4f51fb5))

---

## [5.0.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/5.0.0) (2024-04-27)

### Bug Fixes

* fix `--serve-only` combined with `--coverage` breaks file server ([#87](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/87))
* fix generated JUnit XML report missing required property `classname` for each testcase ([#88](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/88))
* fix `$/selenium-webdriver.js` instantiation command to hide firefox browser
* fix coverage extraction for TypeScript projects

### Features

* support of [webdriver.io](https://webdriver.io/) browser automation through `$/webdriver.io.js` instantiation command
* support of Business Application Studio
* extract all files coverage when `nyc.json`'s `all` is set — a scanner is required for `remote` mode; `$/scan-ui5.js` is provided for `@ui5/cli`
* document warnings that appear during execution
* improve tests coverage by implementing most common end-to-end scenarios

### BREAKING CHANGES

* this version may induce a significant drop in coverage due to the way coverage is calculated when `nyc.json`'s `all` is set

---

## [4.5.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.5.1) (2024-04-16)

### Bug Fixes

* adjust npmignore ([#86](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/86))
* **workflow:** run tests only if push is relevant
* **workflow:** publish docs only if updated

---

## [4.5.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.5.0) (2024-04-12)

### Bug Fixes

* fix issue with qunit-hook: page url is now grabbed from topmost window
* **selenium-webdriver:** fix chrome binary option
* **selenium-webdriver:** reduce traces for chrome

### Features

* add `--split-opa` to automatically split OPA journeys
* add time information in the JUnit XML report

---

## [4.4.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.4.0) (2024-03-16)

### Features

* add `--offline` to limit network usage

---

## [4.3.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.3.2) (2024-03-15)

### Bug Fixes

* **url:** hashes are removed from test pages ([#79](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/79)) ([12dc829](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/12dc829e))

---

## [4.3.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.3.1) (2024-03-08)

### Bug Fixes

* **serve:** better handling of `--serve-only` mode

---

## [4.3.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.3.0) (2024-03-07)

### Bug Fixes

* fix output to avoid flickering

### Features

* new option `--preload` to preload UI5 libraries in legacy mode

---

## [4.2.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.2.1) (2024-02-27)

### Features

* **qunit:** adds delay before closing page ([4aa63ab](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/4aa63aba))
* **debug:** augment qunit traces ([2e17f58](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/2e17f586))
* **debug:** trace qunit/done ([75ee5b7](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/75ee5b73))
* **debug:** trace probing ([3567d63](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/3567d633))

---

## [4.2.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.2.0) (2024-02-26)

### Features

* new option `--alternate-npm-path`

---

## [4.1.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.1.1) (2024-02-23)

### Features

* **post:** prevent error cascading ([257099d](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/257099d8))
* **post:** secure posting by adding tests ([756fb0c](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/756fb0c6))

---

## [4.1.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.1.0) (2024-02-19)

### Features

* improve handling of loose qunit (when started before the tests are loaded)
* progress monitoring now reconnects when the server becomes available
* scripts are injected through SAPUI5 resources and through browser evaluation (when UI5 resources are using CDN)
* regular updates are generated in non interactive output (CI/CD)
* map local sources for remote coverage if found below `webapp`

---

## [4.0.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/4.0.0) (2024-02-08)

### Bug Fixes

* **capabilities:** better handling of asynchronous endpoints, expose inject scripts
* **traces:** updated warning keyword detection for latest drivers
* **job:** remove duplicate option prefix
* remove WebDriverIO integration ([#68](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/68))

### Features

* **screenshot:** tests focus ([#72](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/72))
* **job:** supports URL parameters for testsuite ([#73](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/73))
* **puppeteer:** basic HTTP Authentication ([#71](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/71))
* **screenshot:** debug traces for screenshot
* **output:** debug verbose traces

### BREAKING CHANGES

* drop support of Node 16

---

## [3.3.5](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.3.5) (2023-10-08)

### Bug Fixes

* playwright `--visible` option now working
* repair code coverage when combining `--url` and legacy mode

### Features

* supports QUnit tests starting before the tests are declared (can be blocked with `--qunit-strict`)
* JS and TS samples are now tested to ensure nothing gets broken

---

## [3.3.4](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.3.4) (2023-10-02)

### Bug Fixes

* **coverage:** check files locally before downloading them ([#64](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/64)) ([07710a9](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/07710a9b))

---

## [3.3.3](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.3.3) (2023-09-28)

### Features

* improve documentation and coverage proxy feature

---

## [3.3.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.3.2) (2023-09-25)

### Bug Fixes

* timed out pages are reported as errors
* text report width adjusted to console width ([#61](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/61))
* text report generation error ([#62](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/62))

### Features

* include coverage report in text output, also check for coverage percentage

---

## [3.3.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.3.1) (2023-09-22)

### Bug Fixes

* **coverage:** avoid parallel downloads ([7aa20fa](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/7aa20fab))
* **reporters:** handle test with no report ([776e003](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/776e0038))
* **unhandled:** restore referer URL ([37b51a0](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/37b51a06))
* **download:** remove file if not 200 ([4e61051](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/4e610518))
* **ui5:** disable ui5 mapping only if `--no-ui5` ([#60](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/60)) ([ed70006](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/ed700063))

### Features

* **puppeteer:** disable screenshot in Node 16 ([6af67eb](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/6af67eb5))

---

## [3.3.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.3.0) (2023-09-21)

### Bug Fixes

* fix playwright initialization

### Features

* documentation using mkdocs
* ability to extract coverage in URL mode improved
* reports show the test type (unit or OPA)
* text report provides failure details

---

## [3.2.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.2.0) (2023-06-06)

### Features

* adds [playwright](https://playwright.dev/) support, including video recording and HAR generation

---

## [3.1.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.1.1) (2023-06-01)

### Features

* **output:** associates the url to the short name

---

## [3.1.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.1.0) (2023-05-29)

### Bug Fixes

* **coverage:** handle coverage folders even if no instrumentation ([fix(coverage)](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/fix(coverage)))
* **puppeteer:** use new headless option value
* **jsdom:** window.top is buggy on jsdom, also use parent
* **qunit-redirect:** reduce code size
* **qunit-hooks:** reduce code size
* **post:** remove synchronous post, reduce code size

### Features

* **job:** extract settings from nyc.json ([#50](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/50))
* **coverage:** enable serve-only with coverage info
* **coverage:** instrument only when it makes sense
* **report:** enable the download of the job
* **coverage:** inject script to extract iframe coverage
* **coverage:** new synchronous endpoint to collect coverage data anytime
* **post:** enable synchronous post
* **coverage:** separate collected file names
* **job:** new options to ease coverage debugging

---

## [3.0.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/3.0.0) (2023-05-08)

### Features

* added `--fast-opa-fail`

### BREAKING CHANGES

* drop support of Node.js 14

---

## [2.0.5](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/2.0.5) (2023-04-14)

### Bug Fixes

* nyc issue ([#45](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/45))
* screenshots are taken in case of test failure even if `--no-screenshot` is used; screenshot now appears in the report ([#46](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/46))
* when the report is embedded in an iFrame through `srcdoc`, navigation was not working ([#47](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/47))
* improve time logging in the output

---

## [2.0.4](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/2.0.4) (2023-04-05)

### Features

* improve external packages detection (e.g. puppeteer) by using `require` before trying to load from the local or global npm path

---

## [2.0.3](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/2.0.3) (2023-03-30)

### Bug Fixes

* fix `junit-xml-report` generation for failures without source

---

## [2.0.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/2.0.2) (2023-03-28)

### Bug Fixes

* **report:** detect report generation error and output problem ([#43](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/43))
* **job:** check for relative default path ([#43](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/43))
* **endpoint:** use direct dependency resolver ([#43](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/43))
* **$/report:** use direct dependency resolver ([#43](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/43))

### Features

* **output:** improve child process monitoring to capture output ([#43](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/43))
* **npm:** adds a direct dependency resolver ([#43](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/43))

---

## [2.0.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/2.0.1) (2023-03-23)

### Bug Fixes

* change precedence of mappings to override default ones ([#42](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/42))
* improve job serialization (RegEx were missing)

---

## [2.0.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/2.0.0) (2023-03-04)

### Bug Fixes

* **probe:** terminate probe if nothing is detected
* handling of browserArgs in a config file
* asynchronous xhr requests
* simulate latest version for known modules
* override `sap.ui.test.matchers.visible`
* increase timeouts

### Features

* **puppeteer:** add option to disable security
* `--no-npm-install` option implementation
* allow `logServer` for capabilities
* output version

---

## [1.1.5](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.1.5) (2022-10-26)

### Features

* upgrade node support grid ([7b6a008](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/7b6a008e))
* proxy mappings job configuration ([b365e7c](https://github.com/ArnaudBuchholz/ui5-test-runner/commit/b365e7c6))

---

## [1.1.4](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.1.4) (2022-04-17)

### Bug Fixes

* removes dependency statuses (not working anymore)
* bump versions and security fixes

---

## [1.1.3](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.1.3) (2021-11-24)

### Bug Fixes

* various fixes and improvements ([#28](https://github.com/ArnaudBuchholz/ui5-test-runner/pull/28))

---

## [1.1.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.1.2) (2021-10-27)

### Bug Fixes

* fix some tests are extending QUnit tests dynamically ([#26](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/26))

---

## [1.1.1](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.1.1) (2021-10-26)

### Bug Fixes

* fix issue with screenshots when `QUnit.log` receives a complex object ([#23](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/23))

---

## [1.1.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.1.0) (2021-10-26)

### Bug Fixes

* fix `writeFile` handling
* changed logging of unhandled requests; added unhandled request traces
* secured hook installation (hooks are installed only once)

### Features

* added `noScreenshot` option (`false` by default) — disables screenshot capture during test execution
* implemented screenshot support: screenshot taken for every OPA assertion (`Opa5.assert.ok`)
* introduced browser capabilities protocol with support for `screenshot` and `consoleLog`
* the final screenshot is now triggered by the host at the end of the test run
* isolated per-job and per-coverage trace output to avoid interleaving
* added monitoring of child process console output
* browser window is now maximized at startup

---

## [1.0.7](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.0.7) (2021-09-05)

### Bug Fixes

* better handling of browser failure (`browserRetry`)
* fix ([#17](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/17))

### Features

* preloading of `ui5-test-runner.json`
* introduces `--` to pass parameters to the browser instantiation command

---

## [1.0.6](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.0.6) (2021-08-24)

### Features

* improve integration options: adds `pid` to process messages and introduces structured IPC notifications (`begin`, `ready`, `end`, `error`)
* ignore invalid certificates: sets `ignore-unverifiable-certificate: true` when proxying UI5 resources from a remote URL

---

## [1.0.5](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.0.5) (2021-08-24)

### Features

* enable test automation in external tools
* handles CORS
* notify parent process

---

## [1.0.4](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.0.4) (2021-07-16)

### Features

* preview progress
* command line report
* detailed report
* coverage report
* improves documentation

---

## [1.0.3](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.0.3) (2021-07-02)

### Bug Fixes

* update npm-publish.yml

---

## [1.0.2](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.0.2) (2021-06-29)

### Bug Fixes

* fix keepAlive mode

### Features

* Node 16.x support

---

## [1.0.0](https://github.com/ArnaudBuchholz/ui5-test-runner/releases/tag/1.0.0) (2021-06-01)

* initial version
