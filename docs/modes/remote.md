---
"#type": mode
title: Remote mode
summary: test an already running application reachable at a URL
keywords:
  - remote
  - url
  - running
---

# Testing a running application *(a.k.a. remote mode)*

Since version 2, `ui5-test-runner` can test applications that are **already** served.

This addresses the limits of the [legacy mode](./legacy.md) :

* It is compatible with [@ui5/cli](https://ui5.github.io/cli/v4/pages/CLI/),
* The application may have special requirements to be tested: this is **externalized** from the runner,
* More than one application can be tested at the same time.

On the flip side, it does **not** enable these features :

* Changing the UI5 version,
* Mapping custom libraries.

## Step by step

* Start your application, let's assume that it is available from `https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html`
* Run the following command :

`ui5-test-runner --url https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html`

> 🧠TODO this part is common to all three modes and should probably be isolated in another document

**After** the tests are executed :

* The command line output will provide a summary of executed pages and the corresponding failures :

  ![cmd_report](cmd_report_remote.png)

* The detailed test report is available in the report folder

  ![report](report_remote.png)

* The folder `report/` is created to support execution, you may add it to your project `.gitignore` to exclude it from git