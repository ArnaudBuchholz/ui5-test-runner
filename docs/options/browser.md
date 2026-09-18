---
"#type": option
short: b
type: enumeration
summary: browser selection (per driver)
batchForwarded: yes
typeModifiers:
  - chrome
  - chromium
  - firefox
  - webkit
  - edge
  - safari
validation:
  - message: "browser is not supported by puppeteer (chrome, firefox)"
    conditions:
      - "driver !== 'puppeteer' || browser === 'chrome' || browser === 'firefox'"
  - message: "browser is not supported by playwright (chromium, firefox, webkit)"
    conditions:
      - "driver !== 'playwright' || browser === 'chromium' || browser === 'firefox' || browser === 'webkit'"
  - message: "browser is not supported by webdriverio (chrome, firefox, edge, safari)"
    conditions:
      - "driver !== 'webdriverio' || browser === 'chrome' || browser === 'firefox' || browser === 'edge' || browser === 'safari'"
  - message: "browser is not supported by selenium-webdriver (chrome, firefox, edge, safari)"
    conditions:
      - "driver !== 'selenium-webdriver' || browser === 'chrome' || browser === 'firefox' || browser === 'edge' || browser === 'safari'"
---
