# webdriver.io

## Capabilities

| `--browser` | `$/webdriverio.js` |
|---|---|
| Module | [webdriverio](https://www.npmjs.com/package/webdriverio) |
| Screenshots | <s>✔️ `.png`</s> see [#117](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/117) |
| Scripts | ✔️ |
| Traces 1️⃣ | ❌ |

Browser selection is done by passing browser parameters. For instance :

`ui5-test-runner --browser $/webdriverio.js -- --browser firefox`

Supported browsers :

* chrome
* firefox

## Options

```text
  --visible [flag]                Show the browser (default: false)
  -b, --browser <name>            Browser driver (default: "chrome")
  --binary <binary>               Binary path
  -w, --viewport-width <width>    Viewport width (default: 1920)
  -h, --viewport-height <height>  Viewport height (default: 1080)
  -l, --language <lang...>        Language(s) (default: ["en-US"])
  -u, --unsecure                  Disable security features (default: false)
```

For `chrome` browser, it is possible to provide extra parameters using `--` separator inside browser arguments.

For instance :

* `ui5-test-runner --url http://localhost:8080/testsuite.qunit.html --browser $/webdriverio.js -- --unsecure -- --disable-infobars`
* or *(equivalent)* `ui5-test-runner --url http://localhost:8080/testsuite.qunit.html --browser $/webdriverio.js --browser-args --unsecure --browser-args -- --browser-args --disable-infobars`

## Implementation notes

* 1️⃣ Traces are not yet implemented
