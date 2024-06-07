# jsdom

## Capabilities

| `--browser` | `$/jsdom.js` |
|---|---|
| Module | [jsdom](https://github.com/jsdom/jsdom/) |
| Screenshots | ❌ |
| Scripts | ✔️ |
| Traces | `multiplex` 1️⃣ |

## Options
```text
  --debug [flag]  Enable more traces (default: false)
```

## Implementation notes

* ⛔ This browser instantiation command is provided to demonstrate a different kind of integration. Yet, for performance and compatibility reasons *(see below)*, it is **not** recommended to use it.

* ⚠️ Despite being actively maintained, the `jsdom` project suffers from different implementation problems. `ui5-test-runner` implements a [compatibility](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/src/defaults/jsdom/compatibility.js) layer to compensate some of them *(the ones that are detected during compatibility tests)*. It happens that UI5 and / or `jsdom` changes break this layer.

* `jsdom` does not renders HTML pages, it **cannot** take screenshots

* Because no rendering is done, the `visible` OPA5 matcher is overridden to *'simulate'* visibility testing. This may generate invalid results during OPA tests.

* 1️⃣ Because `jsdom` simulates HTML rendering inside Node.js, any exception immediately interrupts the process. This makes the usual console and network CSV writers unreliable. Instead, all the traces are sent through the standard output and the result `stdout.txt` is a mix of text and JSON output.
