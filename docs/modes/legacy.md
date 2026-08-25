# Serving and testing the application *(a.k.a. legacy mode)*

## Overview

`ui5-test-runner` can **serve** the application to test it.
The application files are delivered through its inner **web server**.

This mode offers unique capabilities such as selecting which UI5 version to use or mapping custom libraries.
* Mapping of libraries

**NOTE** : `ui5-test-runner` can serve the application without testing it with the option `--serve-only`.

## Step by step

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

`ui5-test-runner --port 8081 --libs my/namespace/feature/lib/=../my.namespace.feature.project.lib/src/my/namespace/feature/lib/`

The list of options is available using `ui5-test-runner --help` but to explain the command :
* `--port 8081` : uses the fixed http port `8081`

* `--libs my/namespace/feature/lib/=../my.namespace.feature.project.lib/src/my/namespace/feature/lib/` : maps the library path (access to URL `/resources/my/namespace/feature/lib/library.js` will be mapped to the file path `../my.namespace.feature.project.lib/src/my/namespace/feature/lib/library.js`)

You may also use :
* `--ui5 https://ui5.sap.com/1.109.0/` : uses a specific version of UI5

* `--coverage` : code coverage measurement

* `--parallel` : to increase the number of parallel execution *(default is 2)*

**After** the tests are executed :

* The command line output will provide a summary of executed pages and the corresponding failures :

  ![cmd_report](cmd_report.png)

* The detailed test report is available in the report folder

  ![report](report.png)

* The coverage report is available from http://localhost:8081/_/coverage/lcov-report/index.html

  ![coverage](coverage.png)


* Some folders are created to support execution, you may add them to your project `.gitignore` to exclude them from git :

  * `.nyc_output/` : contains coverage information

  * `report/` : contains test report *(as well as screenshots and console log outputs)*

  * These folder names can be changed through parameters