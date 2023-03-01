# jsdom

## Capabilities

| `--browser` | `$/selenium-webdriver.js` |
|---|---|
| Module | [jsdom](https://github.com/jsdom/jsdom/) |
| Screenshots | ❌ |
| Scripts | ✔️ |
| Traces | `console`, `network` |

## Implementation notes

* `jsdom` does not renders HTML pages, it **cannot** take screenshots
* Because no rendering is done, the `visible` OPA5 matcher is overridden to *'simulate'* visibility testing. This may generate invalid results during OPA tests.