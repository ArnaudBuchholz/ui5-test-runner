---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---
**Version**

- [ ] version 5
- [ ] version 6

**Describe the bug**

A clear and concise description of what the bug is.

**To Reproduce**

Minimal steps to reproduce — ideally a command line invocation or a config file snippet:

```sh
ui5-test-runner --url ... --driver ...
```

**Expected behavior**

What you expected to happen.

**Actual behavior**

What actually happened. Include any error messages or unexpected output.

**Environment**

- `ui5-test-runner` version: <!-- run `ui5-test-runner --version` -->
- Node.js version: <!-- run `node --version` -->
- OS: <!-- e.g. macOS 15, Windows 11, Ubuntu 22.04 -->
- Driver: <!-- e.g. puppeteer, playwright, selenium-webdriver, webdriverio -->
- Browser under test: <!-- e.g. chrome, firefox, chromium -->

**Report**

If the run produced a report, please attach `report.html` (found in the `report/` folder or the folder set by `--report-dir`). It contains structured data, logs, and traces that are essential for diagnosis.
