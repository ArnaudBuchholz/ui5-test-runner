---
"#type": option
title: screenshotOnFailure
type: boolean
summary: take a screenshot when a test fails
default: "true"
batchForwarded: yes
keywords:
  - screenshot
  - failure
relations:
  affects:
    - modes/legacy
    - modes/remote
    - modes/batch
---
The screenshot is captured before the page is closed, so the failed state is preserved.
