---
"#type": option
title: npmInstallMinReleaseAge
type: integer
typeModifiers:
  - positive
summary: minimum release age (in days) required before installing a package
default: 3
batchForwarded: yes
keywords:
  - npm
  - security
relations:
  see-also:
    - options/npmInstall
    - options/noNpmInstall
---
Passes `--min-release-age=<N>` to npm during auto-installation to avoid installing recently published packages. Set to `0` to disable.
