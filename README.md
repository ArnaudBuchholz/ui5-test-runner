# UI5 Test runner

[![Package Quality](https://npm.packagequality.com/shield/ui5-test-runner.svg)](https://packagequality.com/#?package=ui5-test-runner)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/ui5-test-runner/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/ui5-test-runner?targetFile=package.json)
[![dependencies Status](https://david-dm.org/ArnaudBuchholz/ui5-test-runner/status.svg)](https://david-dm.org/ArnaudBuchholz/ui5-test-runner)
[![devDependencies Status](https://david-dm.org/ArnaudBuchholz/ui5-test-runner/dev-status.svg)](https://david-dm.org/ArnaudBuchholz/ui5-test-runner?type=dev)
[![ui5-test-runner](https://badge.fury.io/js/ui5-test-runner.svg)](https://www.npmjs.org/package/ui5-test-runner)
[![ui5-test-runner](http://img.shields.io/npm/dm/ui5-test-runner.svg)](https://www.npmjs.org/package/ui5-test-runner)
[![install size](https://packagephobia.now.sh/badge?p=ui5-test-runner)](https://packagephobia.now.sh/result?p=ui5-test-runner)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner?ref=badge_shield)

A test runner for UI5 applications enabling parallel execution of tests.

> To put it in a nutshell, some applications have so many tests that when you run them in a browser, it ends up **crashing**. The main reason is **memory consumption** : the browser process goes up to 2 GB and it crashes. JavaScript is using garbage collecting but it needs time to operate and the stress caused by executing the tests does not let enough bandwidth for the browser to free up the memory.

> This tool is designed and built as a **substitute** of the [UI5 karma runner](https://github.com/SAP/karma-ui5). It executes all the tests in **parallel** thanks to several browser instances *(which also **reduces the total execution time**)*.

## Documentation

* Concept is detailed in the  article [REserve - Testing UI5](https://arnaud-buchholz.medium.com/reserve-testing-ui5-85187d5eb7f1)
* Tool was presented during UI5Con'21 : [A different approach to UI5 tests execution](https://youtu.be/EBp0bdIqu4s)

## How to install

* Install the [LTS version of Node.js](https://nodejs.org/en/download/)
* `npm install -g ui5-test-runner` *(takes a while because [puppeteer](https://github.com/puppeteer/puppeteer) is quite big)*

## How to demo

* Clone the project [training-ui5con18-opa](https://github.com/ArnaudBuchholz/training-ui5con18-opa) and run `npm install`
* Inside the project, use `npm run karma` to test with the karma runner
* Inside the project, use `ui5-test-runner -port:8080 -ui5:https://ui5.sap.com/1.87.0/ -cache:.ui5`
* You may follow the progress of the test executions using http://localhost:8080/_/progress.html

## How to use

* Clone the project you want to test
* If the project owns library dependencies *(other than UI5)*, you must also clone them.<br/>
  To check for project dependencies, you may look into :
  - `POM.xml` *(for maven based builds)* :
  ```xml
	<dependencies>
		<dependency>
			<groupId>com.sap.fiori</groupId>
			<artifactId>my.namespace.feature.project.lib</artifactId>
			<version>...</version>
		</dependency>

  ```
  - `manifest.json` file :
  ```json
  {
    "sap.ui5": {
		"dependencies": {
			"libs": {
				"my.namespace.feature.lib": {
					"lazy": true
				}
	```

> The following assumes that the project and its dependencies are cloned in **the same** folder. You **must** handle the **differences** between the library **project name** / **structure** and the **namespace** it implements.

* In the project root folder, run the following command :

`ui5-test-runner -port:8080 -cache:.ui5 -libs:my/namespace/feature/lib/=../my.namespace.feature.project.lib/src/my/namespace/feature/lib/`

The list of options is detailed below but to explain the command :
* `-port:8080` : uses the fixed http port `8080`

* `-cache:.ui5` : caches UI5 resources to boost loading of pages. It stores resources in a project folder named `.ui5` *(you may use an absolute path if preferred)*.

* `-libs:hpa/cei/mkt/lib/=../hpa.cei.mkt.lib/src/hpa/cei/mkt/lib/` : maps the library path (access to URL `/resources/hpa/cei/mkt/lib/library.js` will be mapped to the file path `../hpa.cei.mkt.lib/src/hpa/cei/mkt/lib/library.js`)

You may also use :
* `-ui5:https://ui5.sap.com/1.92.1/` : uses a specific version of UI5

* `-coverage:false` : **ignores**  code coverage measurement *(if you don’t need it, it speeds up a bit the startup)*

* `"-args:__URL__ __REPORT__ --visible"` : changes the browser spawning command line to make the browser windows **visible**

* `-parallel:3` : increases *(changes)* the number of parallel execution *(by default it uses 2)*. You may even use `0` to only serve the application *(but the tests are not executed)*.

* `-keepAlive` : the server remains active after executing the tests

  - It is a nice way to run the tests in your own browser.<br/>For instance, open http://localhost:8080/test/unit/unitTests.qunit.html

  - It might be interesting to keep it running to access the detailed report *(see below)*


**During** the test executions *(which can take some time)* you can monitor the progress by opening : http://localhost:8080/_/progress.html

  ![progress](https://raw.githubusercontent.com/ArnaudBuchholz/ui5-test-runner/main/progress.png)

**After** the tests are executed :

* The command line output will provide a summary of executed pages and the corresponding failures :

  ![cmd_report](https://raw.githubusercontent.com/ArnaudBuchholz/ui5-test-runner/main/cmd_report.png)

* The detailed test report is available from http://localhost:8080/_/report.html *(since it uses requests to load the details, the report **must** be open through a web server, don't try to open the .html from the file system... it won't work)*

  ![report](https://raw.githubusercontent.com/ArnaudBuchholz/ui5-test-runner/main/report.png)

* The coverage report is available from http://localhost:8080/_/coverage/lcov-report/index.html

  ![coverage](https://raw.githubusercontent.com/ArnaudBuchholz/ui5-test-runner/main/coverage.png)


* Some folders are created to support execution, you may add them to your project `.gitignore` to exclude them from git :

  - `.nyc_output/` : contains coverage information

  - `report/` : contains test report *(as well as screenshots and console log outputs)*

  - `.ui5/` : contains cached UI5 resources

  - These folder names can be changed through options *(see list of parameters below)*

## Parameters

| name | default | description |
|---|---|---|
| cwd | `process.cwd()` | Current working directory |
| port | `0` | port to use (`0` to let REserve allocate one) |
| ui5 | `'https://ui5.sap.com'` | UI5 url |
| libs | | Folder(s) containing dependent libraries *(relative to `cwd`)*.<br/>Might be used multiple times, two syntaxes are supported :<ul><li>`-libs:path` adds `path` to the list of libraries, mapped directly under `/resources/`</li><li>`-libs:rel/=path` adds the `path` to the list of libraries, mapped under `/resources/rel/`</li></ul> |
| cache | `''` | Cache UI5 resources locally in the given folder *(empty to disable)* |
| webapp | `'webapp'` | base folder of the web application *(relative to `cwd`)* |
| pageFilter | `''` | [regexp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) to select which pages to execute |
| pageParams | `''` | Parameters added to each page URL.<br/>For instance : `'sap-ui-theme=sap_belize&sap-ui-debug=true'` |
| pageTimeout | `0` | Limit the page execution time, fails the page if it takes longer than the timeout (`0` to disable the timeout) |
| globalTimeout | `0` | Limit the pages execution time, fails the execution if it takes longer than the timeout (`0` to disable the timeout) |
| failFast | `false` | Stops the execution after the first failing page |
| keepAlive | `false` | Keeps the server alive *(enables debugging)* |
| watch | `false` | Monitors the webapp folder and re-execute tests on change |
| logServer | `false` | Logs REserve traces |
| browser | *String, see description* | Browser instantiation command, it should point to a node.js script (absolute or relative to `cwd`).<br/>By default, a script will instantiate chromium through puppetteer |
| args | `'__URL__ __REPORT__'` | Browser instantiation arguments :<ul><li>`'__URL__'` is replaced with the URL to open</li><li>`'__REPORT__'` is replaced with a folder path that is associated with the current URL <i>(can be used to store additional traces such as console logs or screenshots)</i></li></ul> |
| parallel | `2` | Number of parallel tests executions (`0` to ignore tests and keep alive) |
| tstReportDir | `'report'` | Directory to output test reports *(relative to `cwd`)* |
| coverage | `true` | Enables code coverage |
| covSettings | *String, see description* | Path to a custom `nyc.json` file providing settings for instrumentation *(relative to `cwd`)* |
| covTempDir | `'.nyc_output'` | Directory to output raw coverage information to *(relative to `cwd`)* |
| covReportDir | `'coverage'` | Where to put the coverage report files *(relative to `cwd`)* |
| covReporters | `'lcov,cobertura'` | Comma separated list of reporters to use |


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FArnaudBuchholz%2Fui5-test-runner?ref=badge_large)