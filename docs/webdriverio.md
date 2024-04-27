# webdriver.io

## Capabilities

| `--browser` | `$/webdriverio.js` |
|---|---|
| Module | [webdriverio](https://www.npmjs.com/package/webdriverio) |
| Screenshots | ✔️ `.png` |
| Scripts | ✔️ |
| Traces 1️⃣ | ❌ |

Browser selection is done by passing browser parameters. For instance :

`ui5-test-runner --browser $/webdriverio.js -- --browser firefox`

Supported browsers :

* chrome
* firefox

## Options
```text
  --visible [flag]      Show the browser (default: false)
  -b, --browser <name>  Browser driver (default: "chrome")
  --binary <binary>     Binary path
```

## Implementation notes

* 1️⃣ Traces are not yet implemented
