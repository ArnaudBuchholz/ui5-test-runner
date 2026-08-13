---
"#type": "[[option]]"
type: "[[integer]]"
summary: minimum release age (in days) required before installing a package
default: 3
batchForwarded: yes
see:
  - "[[npmInstall]]"
  - "[[noNpmInstall]]"
tags:
  - npm
  - security
---
Passes `--min-release-age=<N>` to npm during auto-installation to avoid installing recently published packages. Set to `0` to disable.
