# 📚 Documentation

## 🍁 Overview

A self-sufficient test runner for UI5 applications enabling parallel execution of tests.

* Serve the application with `@ui5/cli`, then run : <br/> `ui5-test-runner --port 8081 --url http://localhost:8080/test/testsuite.qunit.html`,

* Follow the progress of the tests using [`http://localhost:8081/_/progress.html`](http://localhost:8081/_/progress.html),

* Report is generated in the `report/` folder.

## 💬 Presentations
* The initial concept *(version 1 of `ui5-test-runner`)* is explained in the article [REserve - Testing UI5](https://arnaud-buchholz.medium.com/reserve-testing-ui5-85187d5eb7f1)
* [A different approach to UI5 tests execution](https://youtu.be/EBp0bdIqu4s), a live presentation from [UI5Con'21](https://openui5.org/ui5con/)
* [ui5-test-runner v3](https://www.youtube.com/live/kxmmdy1tho4), a live presentation from [Devtoberfest](https://www.youtube.com/playlist?list=PL6RpkC85SLQDHz97qsNTNAE2jnUKj8X5d)

## 📖 Detailed documentation
* [Command line usage](usage.md)
* [Testing a "remote" application](testing.md)
* [Coverage extraction](coverage.md)
* [Serving and testing the application *(a.k.a. legacy mode)*](legacy.md)
* [🆕5.5.0 Batch mode](modes/batch.md)
* [⚠️ Warnings](warnings.md)
* [Tips & tricks](tipsNtricks.md)
* [How to demo](demo.md)
* [Browser instantiation command](browsers/browser.md)

|Automation Library|Browser(s)|Screenshots|Scripts|Traces|
|-|-|-|-|-|
|[puppeteer](puppeteer.md)|`chrome`, `firefox`|✔️|✔️1️⃣|✔️|
|[jsdom](jsdom.md)|*(none)*|❌|✔️|✔️|
|[playwright](playwright.md)|`chrome`, `firefox`, `webkit`|✔️|✔️|✔️|
|[selenium-webdriver](selenium-webdriver.md)|`chrome`, `firefox`, `edge`|✔️|✔️1️⃣|✔️1️⃣|
|[webdriver.io](webdriverio.md)|`chrome`, `firefox`|✔️|✔️|✔️|
|1️⃣ `chrome`|

* [Mapping v1 settings to v2](mapping_v1_v2.md)
