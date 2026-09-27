---
"#type": option
title: npmInstall
type: string
summary: npm install strategy for missing packages
default: "'global'"
keywords:
  - npm
relations:
  see-also:
    - options/noNpmInstall
    - options/npmInstallPrefix
---
Accepted values: `local` (installs with `--no-save`), `global` (installs with `-g`), `prefix` (installs with `--prefix <npmInstallPrefix>`).
