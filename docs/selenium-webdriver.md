# selenium-webdriver

## Capabilities

| `--browser` | `$/selenium-webdriver.js` |
|---|---|
| Module | [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver) |
| Screenshots | ✔️ `.png` |
| Scripts | ❓ *depends on the browser* |
| Traces | ❓ *depends on the browser* |

Browser selection is done by passing browser parameters. For instance :

`ui5-test-runner --browser $/selenium-webdriver.js -- --browser firefox`

Supported browsers :
* chrome
* firefox
* edge

## Implementation notes

Please check https://www.npmjs.com/package/selenium-webdriver#installation for installing browser driver.

Unfortunately, the capabilities depend on the selected browser. Usually, `chrome` is the one with the most features.
