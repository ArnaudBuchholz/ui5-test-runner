---
"#type": "[[option]]"
type: "[[fs-entry]]"
typeModifiers:
  - "[[safe-default]]"
summary: base folder of the UI5 application
default: "'webapp'"
dependsOn: "[[cwd]]"
tags:
  - legacy
  - remote
---

Any `/resources/` or `/test-resources/` path is first looked up inside the webapp folder before being proxied to the [[ui5]] CDN. This means a library cloned or copied into `webapp/resources/` is served automatically without needing a [[lib]] mapping.
