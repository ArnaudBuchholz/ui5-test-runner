---
"#type": "[[option]]"
type: "[[boolean]]"
summary: allow postinstall scripts when installing missing packages
default: false
batchForwarded: yes
see:
  - "[[npmInstall]]"
  - "[[noNpmInstall]]"
tags:
  - npm
  - security
---
By default, `--ignore-scripts` is passed to npm during auto-installation to prevent postinstall scripts from running. Set this option to allow postinstall scripts.
