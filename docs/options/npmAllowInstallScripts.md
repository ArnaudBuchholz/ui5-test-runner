---
"#type": option
title: npmAllowInstallScripts
type: boolean
summary: allow postinstall scripts when installing missing packages
batchForwarded: yes
keywords:
  - npm
  - security
relations:
  see-also:
    - options/npmInstall
    - options/noNpmInstall
---
By default, `--ignore-scripts` is passed to npm during auto-installation to prevent postinstall scripts from running. Set this option to allow postinstall scripts.
