# Browser instantiation command

## Overview

`ui5-test-runner` can integrate **different browsers** to run the tests. In particular, it is delivered with the following implementations :
* [puppeteer](puppeteer.md) *(chrome)*
* [playwright](playwright.md)
  * chromium
  * firefox
  * webkit
* [selenium-webdriver](selenium-webdriver.md)
  * chrome
  * firefox
  * edge
* [jsdom](jsdom.md) *experimental*

The integration consists of a browser instantiation process that is [forked](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options) from `ui5-test-runner`, allowing the runner to capture the output and to do [in-process communication](https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback).

## Probing

Before executing the tests, the runner **queries** the browser instantiation command to **probe its capabilities**.

A JSON file is generated and its **absolute** path is submitted to the command as its only parameter.

```json
{
  "capabilities": "~/report/probe/capabilities.json",
  "url": "about:blank",
  "dir": "~/report/probe",
  "args": []
}
```

> Probing request JSON file

The probing request file is composed of the following properties :
* `capabilities` : path to a result file the command must generate.
* `url` : `"about:blank"`
* `dir` : the working folder allocated for the command.
* `args` : the list of browser arguments specified when running `ui5-test-runner`.

When `capabilities` contains a string, the command  **must** generate an answer JSON file in the given path. This file contains the list of capabilities of the browser.

```json
{
  "modules": [
    "puppeteer"
  ],
  "screenshot": ".png",
  "scripts": true,
  "traces": [
    "console",
    "network"
  ]
}
```

> Capabilities answer JSON file

The following members are considered :
* `modules` : the list of NPM modules the command depends on, defaulted to `[]`. When modules are specified, the runner is responsible of **finding** the dependencies or **installing** them, when needed.
* `parallel` : if the command supports parallel execution, defaulted to `true`.
* `screenshot` : if the command supports screenshot, it contains the extension of the generated files, defaulted to `null` *(screenshots are not supported)*.
* `scripts` : if the command supports script injection *before* loading the page, defaulted to `false`.
* `traces` : a list of keys representing the additional traces captured by the browser.

**NOTE** : the command might request another probe with the dependent modules being resolved, this is done by returning the member `probe-with-modules` set to `true`.

## Executing

Once the capabilities are known, the command is executed to run the tests. A different request file is used :

```json
{
  "capabilities": {},
  "modules": {
    "puppeteer": "~/node_modules/puppeteer"
  },
  "url": "https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html",
  "retry": 0,
  "scripts": [
    "window['ui5-test-runner/base-host'] = 'http://localhost:8081'\n",
    "..."
  ],
  "dir": "~/report/4_hRtpsQ_mU",
  "args": []
}
```

> Execution request JSON file

The execution request file is composed of the following properties :
* `capabilities` : the result of the probe operation. It can be used to store information that is available for execution.
* `modules` : if the probe returned a list of modules, `ui5-test-runner` will ensure to find them either locally or globally. When not found, the runner installs the dependencies globally. Once all the dependencies are resolved, their respective path are given in this object (key is the module name, value is the path).
* `url` : url of the test page to run.
* `retry` : if the command *(not the tests)* failed for any reason, `ui5-test-runner` may try to execute again the same page. The retry count indicates the attempt count. You may use this information to secure the code when retry is not `0`.
* `scripts` : the list of scripts to be injected before executing the page.
* `dir`: the working folder allocated for the command.
* `args`: the list of browser arguments specified when running `ui5-test-runner`.

The command is **expected to instantiate the browser** and open the given url (after evaluating the scripts if any).

## Screenshot

During the tests execution, the runner may request the command to take a screenshot. This is done by exchanging in-process messages.

The command **must** listen on the `'message'` event *(using `process.on`)* and check the `command` received on the property object. If the `command` is `screenshot`, the received object also contains a `filename` member to indicate to which path the screenshot must be generated.

Once the screenshot is generated, the command must send back the *same* message (`process.send`).

## Stopping

Once the tests are finished, or when the runner decides to stop the execution, an in-process message is sent to terminate the command.

The command must listen on the `'message'` event *(using `process.on`)* and check the `command` property on the received object. If the `command` is `stop`, the command must terminate properly. The runner waits for some time (see `--browser-close-timeout`) before **killing** the command if still running.

It is **mandatory** to ensure that the child process explicitly exits at some point *(see this [thread](https://github.com/nodejs/node-v0.x-archive/issues/2605) explaining the fork behavior with Node.js)*.

## Testing

To simplify the development of browser instantiation commands and / or check their compliance to the expectations, `ui5-test-runner` provides the `--capabilities` option to runs a battery of tests.
