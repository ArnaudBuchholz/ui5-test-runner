# ⚠️ Warnings

| Code | Reason |
|--|--|
| **PKGVRS** | The runner loads packages **dynamically**. It first searches for the ones that are local to the project (considering `--cwd`) and then the global ones. It is also possible to request an alternate path, see `--alternate-npm-path`. When the package is **missing**, the latest version is **installed globally**. Otherwise, the runner will compare the version of the package found with the latest in the NPM registry. If different, this warnings is shown. If problems occur while running the tests, consider **upgrading** the packages before submitting an issue. |
| **UNHAND** | In `legacy` mode, the runner acts as a web server for the application files. When a request cannot be served, the corresponding details are logged in the `unhandled.txt` report file. |
| **SKPNYC** | When `--url` is used, instrumentation is skipped because it is expected that the sources files are not reachable. See [coverage](coverage.md) for more details. |
| **COVMIS** | When `--coverage` is used but no coverage information is collected after a test completed: this may mean that the configuration is incomplete. See [coverage](coverage.md) for more details. |
| **COVORG** | When `--url` is used with `--coverage`, the runner must download *(and / or scan)* source files from the remote location. If the provided list of url does not have the same origin, only the first one is considered. |
| **COVALL** | When all coverage is requested (setting `all` in `.nycrc.json`), the runner tries to process all files either locally (`legacy`) or remotely (`remote`). When the runner cannot complete this task, this message indicates that the coverage report might miss some files. |
| **SKIPIF** | When the condition specified using `--if` returns a [falsy value](https://developer.mozilla.org/en-US/docs/Glossary/Falsy), the runner execution is skipped. |
| **BATCHF** | Invalid batch (`--batch`) specification, reason is specified in the trace. |
| **BATCHM** | Displayed when a batch item is executed, see [Batch mode](https://arnaudbuchholz.github.io/ui5-test-runner/batch/). |
