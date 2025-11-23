# UI5 Test runner 6️⃣

[![Node.js CI](https://github.com/ArnaudBuchholz/ui5-test-runner/actions/workflows/node.js.yml/badge.svg)](https://github.com/ArnaudBuchholz/ui5-test-runner/actions/workflows/node.js.yml)
[![Package Quality](https://npm.packagequality.com/shield/ui5-test-runner.svg)](https://packagequality.com/#?package=ui5-test-runner)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/ui5-test-runner/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/ui5-test-runner?targetFile=package.json)
[![ui5-test-runner](https://badge.fury.io/js/ui5-test-runner.svg)](https://www.npmjs.org/package/ui5-test-runner)
[![PackagePhobia](https://img.shields.io/badge/%F0%9F%93%A6package-phobia-lightgrey)](https://packagephobia.com/result?p=ui5-test-runner)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner?ref=badge_shield)
[![Documentation](https://img.shields.io/badge/-%F0%9F%93%9Adocumentation-blueviolet)](https://arnaudbuchholz.github.io/ui5-test-runner/)

A self-sufficient test runner for UI5 applications enabling parallel execution of tests.

> To put it in a nutshell, some UI5 applications have so many tests that when you run them in a browser, it ends up **crashing**. The main reason is **memory consumption** : the browser process goes up to 2 GB and it blows up. JavaScript is based on garbage collecting but it needs time to operate and the stress caused by executing the tests as well as the use of iframes do not let enough bandwidth for the browser to free up the memory.

> This tool is designed and built as a **substitute** of the [UI5 karma runner](https://github.com/SAP/karma-ui5). It executes all the tests in **parallel** thanks to several browser instances *(which also **reduces the total execution time**)*.

## 📚 [Documentation](https://arnaudbuchholz.github.io/ui5-test-runner/)

## 💿 How to install

* Works with [Node.js](https://nodejs.org/en/download/) >= 24
* Local installation
  * `npm install --save-dev ui5-test-runner`
  * Trigger either with `npx ui5-test-runner` or through an npm script invoking `ui5-test-runner`
* Global installation
  * `npm install --global ui5-test-runner`
  * Trigger with `ui5-test-runner`

**NOTE** : additional packages might be needed during the execution (`puppeteer`, `selenium-webdriver`, `nyc`...) . If they are found installed **locally** in the tested project, they are used. Otherwise, they are installed **globally**.

## ⚖️ License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner?ref=badge_large)

## ⚠️ Breaking changes

| Version | Reason | 
|-|-|
| **6**.0.0 | • Drop support of Node.js < 24 |
| **5**.0.0 | • Some coverage reports now includes **all** files, leading to a potential decrease of coverage |
| **4**.0.0 | • Drop support of Node.js 16 |
| **3**.0.0 | • Drop support of Node.js 14 |
| **2**.0.0 | • Command line **parameters** as well as configuration file **syntax** have changed |
|| • Dependencies are installed **on demand** |
|| • Browser instantiation command evolved in an **incompatible way** (see [documentation](https://arnaudbuchholz.github.io/ui5-test-runner/browser.html)) |
|| • Output is different (report, traces) |

## ✒ Contributors

* [Marian Zeis](https://github.com/marianfoo): Documentation page revamp [PR #54](https://github.com/ArnaudBuchholz/ui5-test-runner/pull/54)
* [Raj Singh](https://github.com/rajxsingh): Basic HTTP Authentication in Puppeteer [PR #71](https://github.com/ArnaudBuchholz/ui5-test-runner/pull/71)
* [Andreas Kunz](https://github.com/akudev): Improved documentation for TypeScript testing and reviewed `nyc` settings handling [PR #110](https://github.com/ArnaudBuchholz/ui5-test-runner/pull/110)
* [Juri Zeisler](https://github.com/juriz889): Added screenshots to the JUnit XML Report [PR #158](https://github.com/ArnaudBuchholz/ui5-test-runner/pull/158)
