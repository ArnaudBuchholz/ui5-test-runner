---
"#type": mode
title: Remote mode
summary: test an already running application reachable at a URL
keywords:
  - remote
  - url
  - running
relations:
  requires:
    - options/url
---
# Testing a running application *(a.k.a. remote mode)*

Since version 2, `ui5-test-runner` can test applications that are **already** served.

This addresses the limits of the [legacy mode](./legacy.md) :

* It is compatible with [@ui5/cli](https://ui5.github.io/cli/v4/pages/CLI/),
* The application may have special requirements to be tested: this is **externalized** from the runner,
* More than one application can be tested at the same time.

> **Deciding between legacy and remote mode:** if the application is already served by another tool — in particular when you develop with [@ui5/cli](https://ui5.github.io/cli/v4/pages/CLI/) (`ui5 serve`) — you **must** use remote mode and point the runner at the running URL with [`--url`](../options/url.md). Legacy mode would try to serve the application itself, which conflicts with `@ui5/cli` already serving it. Use legacy mode only when you want `ui5-test-runner` to serve the application.

On the flip side, it does **not** enable these features :

* Changing the UI5 version,
* Mapping custom libraries.

## Step by step

* Start your application, let's assume that it is available from `https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html`
* Run the following command :

`ui5-test-runner --url https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html`

> 🧠TODO this part is common to all three modes and should probably be isolated in another document

**After** the tests are executed :

* The command line output will provide a summary of executed pages and the corresponding failures

* The detailed test report is available in the `report/` folder

* The folder `report/` is created to support execution, you may add it to your project `.gitignore` to exclude it from git