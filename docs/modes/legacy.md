---
"#type": mode
title: Legacy mode
summary: serve the application from an inner web server and test it
keywords:
  - legacy
  - serve
  - webapp
relations:
  requires:
    - options/lib
    - options/ui5
  see-also:
    - options/serveOnly
    - web_server
---
# Serving and testing the application *(a.k.a. legacy mode)*

## Overview

`ui5-test-runner` can **serve** the application to test it.
The application files are delivered through its inner **web server**.

This mode offers unique capabilities such as selecting which UI5 version to use or mapping custom libraries.

**NOTE** : `ui5-test-runner` can serve the application without testing it with the option [`--serve-only`](../options/serveOnly.md).

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

`ui5-test-runner --port 8081 --lib my/namespace/feature/lib/=../my.namespace.feature.project.lib/src/my/namespace/feature/lib/`

You may also use :
* `--ui5 https://ui5.sap.com/1.109.0/` : uses a specific version of UI5

* `--coverage` : code coverage measurement

* `--parallel` : to increase the number of parallel execution *(default is 2)*

After the tests are executed, the results are available as described in the [[report]] document:

* A summary is printed to the command line output
* `report/` — detailed test report (configurable with `--report-dir`)
* `coverage/` — coverage report (configurable with `--coverage-report-dir`)
* `.nyc_output/` — raw coverage data

You may add these folders to your project `.gitignore`.