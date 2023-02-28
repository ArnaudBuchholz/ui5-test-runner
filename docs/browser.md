# Browser instantiation command (👷 *work in progress*)

## Overview

`ui5-test-runner` can integrate **different browsers** to run the tests. In particular, it is delivered with the following solutions :
* [puppeteer](puppeteer.md) *(chrome)*
* [jsdom](jsdom.md)
* [selenium-webdriver](selenium-webdriver.md)
  * chrome
  * firefox
  * edge

The integration is realized with a browser instantiation command that is [forked](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options) from `ui5-test-runner`, allowing the runner to capture the output but also to do [in-process communication](https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback).

## probing

Before executing the tests, the runner **queries** the browser instantiation command to **probe its capabilities**.

A JSON file is generated and its **absolute** path submitted to the command as its only parameter.

```json
{
  "capabilities": "~/report/probe/capabilities.json",
  "url": "about:blank",
  "dir": "~/report/probe",
  "args": []
}
```

> Probing request JSON file

All browser arguments specified when running `ui5-test-runner` are transmitted through the `args` array.

When `capabilities` contains a string, the command is **expected** to generate an answer JSON file in the given path. This file provides the list of capabilities of the browser.

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

The following members are expected :
* `modules` : the list of dependent NPM modules, defaulted to `[]`
* `screenshot` : if the command supports screenshot, it contains the extension of the generated files, defaulted to `null` *(screenshots are not supported)*
* `scripts` : a boolean to indicate if the command supports script injection *before* loading the page, defaulted to `false`
* `traces` : a list of keys representing the additional traces captured by the browser (*experimental*, no impact on the execution)

**NOTE** : the command might request another probe with the dependent modules being resolved, this is done by returning the member `probe-with-modules` set to `true`.

## executing

Once the capabilities are retrieved, the same command is executed again with a slightly different request file :

```json
{
  "capabilities": {
    "modules": [
      "puppeteer"
    ],
    "screenshot": ".png",
    "scripts": true,
    "parallel": true,
    "traces": [
      "console",
      "network"
    ]
  },
  "modules": {
    "puppeteer": "C:\\Users\\Nano et Nono\\AppData\\Roaming\\npm\\node_modules\\puppeteer"
  },
  "url": "https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html",
  "retry": 0,
  "scripts": [
    "window['ui5-test-runner/base-host'] = 'http://localhost:8081'\n",
    "(function () {\r\n  'use strict'\r\n\r\n  if (window['ui5-test-runner/post']) {\r\n    return\r\n  }\r\n\r\n  const base = window['ui5-test-runner/base-host'] || ''\r\n\r\n  let lastPost = Promise.resolve()\r\n  let UI5Object\r\n\r\n  function stringify (data) {\r\n    const objects = []\r\n    const referenced = []\r\n    if (!UI5Object && window.sap && window.sap.ui && window.sap.ui.base) {\r\n      UI5Object = window.sap.ui.base.Object\r\n    }\r\n    const ui5Summary = obj => {\r\n      const id = obj.getId && obj.getId()\r\n      const className = obj.getMetadata().getName()\r\n      return {\r\n        'ui5:class': className,\r\n        'ui5:id': id\r\n      }\r\n    }\r\n    const simple = JSON.stringify(data, function (key, value) {\r\n      if (typeof value === 'object' && value) {\r\n        if (UI5Object && value instanceof UI5Object) {\r\n          return ui5Summary(value)\r\n        }\r\n        const id = objects.indexOf(value)\r\n        if (id !== -1) {\r\n          referenced[id] = true\r\n          return null // Skip error and check all references\r\n        }\r\n        objects.push(value)\r\n      }\r\n      return value\r\n    })\r\n    if (referenced.length === 0) {\r\n      return simple\r\n    }\r\n    const stringified = []\r\n    return JSON.stringify(data, function (key, value) {\r\n      if (typeof value === 'object' && value) {\r\n        if (UI5Object && value instanceof UI5Object) {\r\n          return ui5Summary(value)\r\n        }\r\n        const id = objects.indexOf(value)\r\n        if (referenced[id]) {\r\n          if (stringified[id]) {\r\n            return { 'circular:ref': id }\r\n          }\r\n          stringified[id] = true\r\n          if (Array.isArray(value)) {\r\n            return {\r\n              'circular:id': id,\r\n              'circular:array': [].concat(value) // 'new' object\r\n            }\r\n          }\r\n          return Object.assign({\r\n            'circular:id': id\r\n          }, value)\r\n        }\r\n      }\r\n      return value\r\n    })\r\n  }\r\n\r\n  window['ui5-test-runner/stringify'] = stringify\r\n\r\n  window['ui5-test-runner/post'] = function post (url, data) {\r\n    function request () {\r\n      return new Promise(function (resolve, reject) {\r\n        const xhr = new XMLHttpRequest()\r\n        xhr.addEventListener('load', () => {\r\n          resolve(xhr.responseText)\r\n        })\r\n        xhr.addEventListener('error', () => {\r\n          reject(xhr.statusText)\r\n        })\r\n        xhr.open('POST', base + '/_/' + url)\r\n        xhr.setRequestHeader('x-page-url', location)\r\n        xhr.send(stringify(data))\r\n      })\r\n    }\r\n    lastPost = lastPost\r\n      .then(undefined, function (reason) {\r\n        console.error('Failed to POST to ' + url + '\\nreason: ' + reason.toString())\r\n        throw new Error('failed')\r\n      })\r\n      .then(request)\r\n    return lastPost\r\n  }\r\n}())\r\n",
    "(function () {\r\n  'use strict'\r\n\r\n  if (window['ui5-test-runner/qunit-redirect']) {\r\n    return // already installed\r\n  }\r\n  window['ui5-test-runner/qunit-redirect'] = true\r\n\r\n  /* global suite */\r\n\r\n  const post = window['ui5-test-runner/post']\r\n\r\n  const pages = []\r\n\r\n  function jsUnitTestSuite () {}\r\n\r\n  jsUnitTestSuite.prototype.addTestPage = function (url) {\r\n    pages.push(url)\r\n  }\r\n\r\n  window.jsUnitTestSuite = jsUnitTestSuite\r\n\r\n  window.addEventListener('load', function () {\r\n    if (typeof suite === 'function') {\r\n      suite()\r\n      post('addTestPages', pages)\r\n    } else if (typeof QUnit === 'object') {\r\n      post('addTestPages', [location.toString()])\r\n    }\r\n  })\r\n}())\r\n"
  ],
  "dir": "E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\report\\4_hRtpsQ_mU",
  "args": []
}
```

> Execution request JSON file

### screenshot

## Building a custom browser instantiation command

* You may follow the pattern being used by [`pupepeteer.js`](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/defaults/pupepeteer.js)

* The command accepts only one parameter
* When the command is invoked with `capabilities` : it should dump the list of capabilities and stop. The expected result is a valid JSON that must be written on the standard output.
  The expected members are :
  - `modules` *(optional, array of strings, default is `[]`)* : the list of NPM modules the command dynamically depends on (see below).
  - `screenshot` *(optional, boolean, default is `false`)* : does the command support the `screenshot` message.
  - `console` *(optional, boolean, default is `false`)* : does the command support saving the console output.
  - `scripts` *(optional, boolean, default is `false`)* : does the command support scripts injection.

For instance : 
```json
{
  "modules": ["puppeteer"],
  "screenshot": true,
  "console": true,
  "scripts": true
}
```

* Otherwise the command is invoked with a path to a JSON file : it must load the settings and start the browser accordingly.
  The expected JSON syntax includes :
  

* During execution, the child process will receive messages that must be handled appropriately :
  - `message.command === 'stop'` : the browser must be closed and the command line must exit
  - `message.command === 'screenshot'` : should generate a screenshot (the message contains a `filename` member with an absolute path). To indicate that the screenshot is done, the command line must send back the same message (`process.send(message)`).
* It is **mandatory** to ensure that the child process explicitly exits at some point *(see this [thread](https://github.com/nodejs/node-v0.x-archive/issues/2605) explaining the fork behavior with Node.js)*
