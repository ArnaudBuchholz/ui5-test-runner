---
"#type": "[[option]]"
type: "[[string]]"
summary: npm install strategy for missing packages
default: "'global'"
see:
  - "[[noNpmInstall]]"
  - "[[npmInstallPrefix]]"
tags:
  - npm
---
Accepted values: `local` (installs with `--no-save`), `global` (installs with `-g`), `prefix` (installs with `--prefix <npmInstallPrefix>`).
