# Coverage extraction

## Overview

Tests ensure that the code **behaves** as expected.
The code coverage checks which lines of code (function, branches...) are **executed** while running the tests.

If the code coverage shows that only 10% of the code is executed during your tests it means that 90% of the code is either not tested or useless.

**NOTE** : having 100% code coverage does not mean that the code is fully tested !

For instance, considering the function to test :

```javascript
function div (a, b) { return a / b; }
```

This assertion generates 100% code coverage :

```javascript
assert.notStrictEqual(div(4,2), 0);
```

But, in reality, it says almost nothing on the tested code.

## How does it work ?

The following is a summary of the article [REserve — Testing UI5 — Measuring code coverage](https://medium.com/@arnaud-buchholz/reserve-testing-ui5-measuring-code-coverage-ef303af051ef).

Three steps are required to measure code coverage :
1. **Instrumentation** of the code
2. **Execution** of the tests
3. **Extraction** and **consolidation** of code coverage

The first step is realized with [`nyc`](https://www.npmjs.com/package/nyc) which is a wrapper for [`istanbul`](https://www.npmjs.com/package/istanbul).
It rewrites the code in such a way that :

* The code behavior does **not** change
* While the code is executed, it keeps track of which functions, lines and conditions are evaluated.

`ui5-test-runner` takes care of the second step. Based on the mode and options, it will either substitute the source files with the instrumented ones or expect the source to provide coverage information *(see below)*.

While running, the runner extracts the code coverage information for each page (available within `window.top.__coverage__`) and stores it in the coverage temporary folder.

When all the test pages are executed, the coverage report is generated using two commands :

* `nyc merge` to merge the different coverage reports in a single one,
* `nyc report` to generate the report.

## `nyc.json`

Coverage settings are specified through a `nyc.json` file, available options are described [here](https://github.com/istanbuljs/nyc?tab=readme-ov-file#common-configuration-options).

The runner provides a minimal configuration file with :
```json
{
  "all": true,
  "sourceMap": false
}
```

The `all` option, when set, significantly impacts the coverage report. It forces the runner to scan the project to discover all files :

* In `legacy` mode, the runner is responsible of instrumentating the sources. Hence it is almost seamless. 
* However, in `remote` mode, a **scanner** is required to discover and fetch instrumented files from the remote repository. A default scanner is provided for `@ui5/cli` served projects (`$/scan-ui5.js`).

## Legacy mode

In this mode, source files are directly manipulated by `ui5-test-runner`.

## Remote mode

It is possible to extract code coverage using the `remote` mode.

### JavaScript `@ui5/cli` projects : `@ui5/middleware-code-coverage`

The [`@ui5/middleware-code-coverage`](https://www.npmjs.com/package/@ui5/middleware-code-coverage) middleware is capable of instrumenting the source files on the fly (by adding `?instrument=true` to the URL of the file).

According to the documentation, the coverage information can be leveraged only from UI5 1.113 thanks to `qunit-coverage-istanbul.js` which adds the URL parameter dynamically.

`ui5-test-runner` reproduces the behavior by altering the URLs without `qunit-coverage-istanbul.js` making the coverage available for *any* version.

Here is an example of `ui5.yaml` configuration file to include the middleware.

```yaml
specVersion: '3.0'
metadata:
  name: training-ui5con18-opa
type: application
server:
  customMiddleware:
  - name: "@ui5/middleware-code-coverage"
    afterMiddleware: compression
    configuration:
      instrument:
        produceSourceMap: true
        coverageGlobalScope: "window.top"
        coverageGlobalScopeFunc: false
      excludePatterns:
        - "resources/"
```

**Implementation note** : unlike the expected usage of the middleware, `ui5-test-runner` generates the coverage report. It forces the runner to download all the covered source files locally to ensure the report can be generated.

### TypeScript `@ui5/cli` projects : tweaking `ui5-tooling-transpile`

The [`ui5-tooling-transpile`](https://www.npmjs.com/package/ui5-tooling-transpile) middleware converts TypeScript into JavaScript while serving the application. Its configuration can be tweaked to also achieve instrumentation during this step.

```yaml
specVersion: "3.0"
server:
  customMiddleware:
    - name: ui5-tooling-transpile-middleware
      afterMiddleware: compression
      configuration:
        debug: true
        babelConfig:
          sourceMaps: true
          ignore:
          - "**/*.d.ts"
          presets:
          - - "@babel/preset-env"
            - targets: defaults
          - - transform-ui5
            - overridesToOverride: true
          - "@babel/preset-typescript"
          plugins:
          - istanbul
```

**NOTE** : The `overridesToOverride` is only needed in ui5 versions < 1.112.x as mentioned in the [transform-ui5 documentation](https://github.com/ui5-community/babel-plugin-transform-modules-ui5?tab=readme-ov-file#properties-related-to-controller-extensions).

**NOTE** : You may consider tweaking in a distinct configuration file and use the `--config` option to run it.

For instance : `ui5 serve --config ui5-coverage.yaml`

### coverage-proxy *(experimental)*

If the remote server does not provide instrumented source files, an experimental approach consists in using `ui5-test-runner` as a 'proxy' to get the files. It will instrument the sources on the fly.

Example :
```bash
ui5-test-runner --url https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html --coverage --coverage-proxy --coverage-proxy-include webapp/* --coverage-proxy-exclude webapp/test --disable-ui5
```

