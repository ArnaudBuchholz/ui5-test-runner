---
"#type": "[[option]]"
type: "[[boolean]]"
summary: enable code coverage
default: "false"
tags:
  - coverage
  - legacy
  - remote
---
When set, ui5-test-runner instruments source files, collects `window.__coverage__` data from each test page, and generates a coverage report after all pages complete.

Coverage is always opt-in and must be enabled explicitly — it is never activated by default regardless of mode.
