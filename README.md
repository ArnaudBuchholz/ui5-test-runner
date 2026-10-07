# UI5 Test runner

[![Node.js CI](https://github.com/ArnaudBuchholz/ui5-test-runner/actions/workflows/node.js.yml/badge.svg)](https://github.com/ArnaudBuchholz/ui5-test-runner/actions/workflows/node.js.yml)
[![Package Quality](https://npm.packagequality.com/shield/ui5-test-runner.svg)](https://packagequality.com/#?package=ui5-test-runner)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/ui5-test-runner/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/ui5-test-runner?targetFile=package.json)
[![ui5-test-runner](https://badge.fury.io/js/ui5-test-runner.svg)](https://www.npmjs.org/package/ui5-test-runner)
[![PackagePhobia](https://img.shields.io/badge/%F0%9F%93%A6package-phobia-lightgrey)](https://packagephobia.com/result?p=ui5-test-runner)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner?ref=badge_shield&issueType=license)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner?ref=badge_shield&issueType=security)
[![Documentation](https://img.shields.io/badge/-%F0%9F%93%9Adocumentation-blueviolet)](https://github.com/ArnaudBuchholz/ui5-test-runner/tree/main/docs#-documentation)


A self-sufficient test runner for [UI5 applications](https://ui5.sap.com/) enabling parallel execution of tests.

> To put it in a nutshell, some [UI5 applications](https://ui5.sap.com/) have so many tests that when you run them in a browser, it ends up **crashing**. The main reason is **memory consumption** : the browser process goes up to 2 GB and it blows up. JavaScript is based on garbage collecting but it needs time to operate and the stress caused by executing the tests as well as the use of iframes do not let enough bandwidth for the browser to free up the memory.

> This tool is designed and built as a **substitute** of the [UI5 karma runner](https://github.com/SAP/karma-ui5). It executes all the tests in **parallel** thanks to several browser tabs *(which also **reduces the total execution time**)*.

## 💿 How to install

* Works with [Node.js](https://nodejs.org/en/download/) >= 24
* Local installation
  * `npm install --save-dev ui5-test-runner`
  * Trigger either with `npx ui5-test-runner` or through an npm script invoking `ui5-test-runner`
* Global installation
  * `npm install --global ui5-test-runner`
  * Trigger with `ui5-test-runner`

**NOTE** : additional packages might be needed during the execution (`puppeteer`, `selenium-webdriver`, `nyc`...) . If they are found installed **locally** in the tested project, they are used. Otherwise, they are installed **on demand**.

## 🧭 Links

* 📚 [Documentation](https://github.com/ArnaudBuchholz/ui5-test-runner/tree/main/docs#-documentation)

* ⚠️ [Breaking changes](docs/v6_breaking_changes.md)

* ✒ [Contributors]((https://github.com/ArnaudBuchholz/ui5-test-runner/graphs/contributors?all=1))


