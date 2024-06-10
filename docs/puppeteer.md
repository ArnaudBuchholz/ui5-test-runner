# puppeteer

## Capabilities

| `--browser` | `$/puppeteer.js` |
|---|---|
| Module | [puppeteer](https://www.npmjs.com/package/puppeteer) |
| Screenshots 1️⃣ | ✔️ `.png` |
| Scripts | ✔️ `chrome` |
| | ❌ `firefox` 2️⃣ |
| Traces | `console`, `network` |

## Options

```text
  --visible [flag]                  Show the browser (default: false)
  --firefox [flag]                  Use firefox instead of chrome (default:
                                    false)
  --binary <binary>                 Binary path
  -w, --viewport-width <width>      Viewport width (default: 1920)
  -h, --viewport-height <height>    Viewport height (default: 1080)
  -l, --language <lang...>          Language(s) (default: ["en-US"])
  -u, --unsecure                    Disable security features (default: false)
  --basic-auth-username <username>  Username for basic authentication (default:
                                    "")
  --basic-auth-password <password>  Password for basic authentication (default:
                                    "")
```

For `chrome` browser, it is possible to provide extra parameters using `--` separator inside browser arguments.

For instance :

* `ui5-test-runner --url http://localhost:8080/testsuite.qunit.html -- --unsecure -- --disable-infobars`
* or *(equivalent)* `ui5-test-runner --url http://localhost:8080/testsuite.qunit.html --browser-args --unsecure --browser-args -- --browser-args --disable-infobars`


## Implementation notes

* When facing the error `ERROR: Failed to set up Chrome r<version>!`, you might consider defining the environment variable `PUPPETEER_SKIP_DOWNLOAD=true`, see the corresponding [puppeteer issue](https://github.com/puppeteer/puppeteer/issues/6492).

* To use with the [puppeteer docker image](ghcr.io/puppeteer/puppeteer), the runner must be configured to find the packages : `--alternate-npm-path /home/pptruser/node_modules`.

* 1️⃣ Screenshot feature is **failing** because of missing [`structuredClone` API](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone#browser_compatibility) on Node.js 16. Since the problem is **inside** `puppeteer` ([issue](https://github.com/puppeteer/puppeteer/issues/11004)), the feature is turned off for this version.

* 2️⃣ `firefox` does not support scripting in `puppeteer`, see this [issue](https://www.github.com/puppeteer/puppeteer/issues/6163).
