# puppeteer

## Capabilities

| `--browser` | `$/puppeteer.js` |
|---|---|
| Module | [puppeteer](https://www.npmjs.com/package/puppeteer) |
| Screenshots 1️⃣ | ✔️ `.png` |
| Scripts | ✔️ |
| Traces | `console`, `network` |

## Options
```text
  --visible [flag]                Show the browser (default: false)
  -w, --viewport-width <width>    Viewport width (default: 1920)
  -h, --viewport-height <height>  Viewport height (default: 1080)
  -l, --language <lang...>        Language(s) (default: ["en-US"])
  -u, --unsecure                  Disable security features (default: false)
```

## Implementation notes

* 1️⃣ Screenshot feature is **failing** because of missing [`structuredClone` API](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone#browser_compatibility) on Node.js 16. Since the problem is **inside** `puppeteer` ([issue](https://github.com/puppeteer/puppeteer/issues/11004)), the feature is turned off for this version.
