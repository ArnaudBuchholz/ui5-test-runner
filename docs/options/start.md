---
"#type": "[[option]]"
type: "[[string]]"
summary: command to be executed before the tests
tags:
  - legacy
  - remote
  - batch
see:
  - "[[cwd]]"
  - "[[startWaitUrl]]"
  - "[[startTimeout]]"
---

The command string accepts `{{optionName}}` placeholders, which are expanded at runtime using the value of the corresponding configuration option (e.g. `cwd`, `reportDir`). The command executes with `cwd` as its working directory.

The process is started in detached mode and will be automatically stopped after the tests complete.

## Command syntax

The command string is split on whitespace (single or double quotes group tokens with spaces):

```
[KEY=value ...] <executable> [args ...]
```

The executable defaults to `node` if not specified. Use `npm` to run npm scripts — it is automatically replaced with the path to the npm CLI. If the executable matches a script name defined in the `package.json` closest to `cwd`, it is automatically run as `npm run <script>`.

## Environment variables

One or more `KEY=value` assignments can be placed before the executable. They are injected into the spawned process on top of the current environment:

```
TEST_ENV=production node server.js
DEBUG=true PORT=3000 node server.js
```

`{{optionName}}` placeholders are also expanded in environment variable values:

```
REPORT_DIR={{reportDir}} node server.js
```
