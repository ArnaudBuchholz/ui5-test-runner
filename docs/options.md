|Option|CLI arg|CLI shorcut|Type|Description|
|---|---|---|---|---|
|[cwd](options/cwd.md)|--cwd|-c|fs-entry|set working directory|
|[webapp](options/webapp.md)|--webapp||fs-entry|base folder of the UI5 application|
|[testsuite](options/testsuite.md)|--testsuite||string|path of the testsuite file|
|[agentDetectionInterval](options/agentDetectionInterval.md)|--agent-detection-interval||timeout|initial polling interval when detecting a test framework after page load|
|[agentDetectionMaxInterval](options/agentDetectionMaxInterval.md)|--agent-detection-max-interval||timeout|maximum polling interval when detecting a test framework after page load|
|[agentDetectionTimeout](options/agentDetectionTimeout.md)|--agent-detection-timeout||timeout|maximum time to wait for a test framework to be detected after page load|
|[agentNoTestsTimeout](options/agentNoTestsTimeout.md)|--agent-no-tests-timeout||timeout|time to wait after QUnit.done fires with no tests before declaring the page done|
|[alternateNpmPath](options/alternateNpmPath.md)|--alternate-npm-path||fs-entry|alternate NPM package path|
|[batch](options/batch.md)|--batch||string|batch item specification (folder, config file, or regex pattern)|
|[batchId](options/batchId.md)|--batch-id||string|identifier for the batch item|
|[batchLabel](options/batchLabel.md)|--batch-label||string|display label for the batch item|
|[batchTimeout](options/batchTimeout.md)|--batch-timeout|-bt|timeout|fails a batch item if it takes longer than this timeout|
|[browser](options/browser.md)|--browser|-b|browser|browser selection|
|[browserViewportHeight](options/browserViewportHeight.md)|--browser-viewport-height|-H|integer|height of the browser viewport in pixels|
|[browserViewportWidth](options/browserViewportWidth.md)|--browser-viewport-width|-W|integer|width of the browser viewport in pixels|
|[browserVisible](options/browserVisible.md)|--browser-visible|-V|boolean|control if the browser should be visible during the tests|
|[ci](options/ci.md)|--ci||boolean|forces CI mode (no interactive output)|
|[config](options/config.md)|--config||fs-entry|read options from a configuration file|
|[coverage](options/coverage.md)|--coverage||boolean|enable code coverage|
|[coverageCheckBranches](options/coverageCheckBranches.md)|--coverage-check-branches|-ccb|percent|minimum branch coverage threshold (0 = no check)|
|[coverageCheckFunctions](options/coverageCheckFunctions.md)|--coverage-check-functions|-ccf|percent|minimum function coverage threshold (0 = no check)|
|[coverageCheckLines](options/coverageCheckLines.md)|--coverage-check-lines|-ccl|percent|minimum line coverage threshold (0 = no check)|
|[coverageCheckStatements](options/coverageCheckStatements.md)|--coverage-check-statements|-ccs|percent|minimum statement coverage threshold (0 = no check)|
|[coverageReportDir](options/coverageReportDir.md)|--coverage-report-dir|-crd|fs-entry|directory for the final coverage report|
|[coverageReporters](options/coverageReporters.md)|--coverage-reporters|-cr|string|istanbul-lib-report reporters to use|
|[coverageSettings](options/coverageSettings.md)|--coverage-settings|-cs|fs-entry|path to the Istanbul configuration file (.nycrc.json)|
|[coverageSourceDir](options/coverageSourceDir.md)|--coverage-source-dir||fs-entry|directory containing the source files used for coverage reporting|
|[coverageTempDir](options/coverageTempDir.md)|--coverage-temp-dir|-ctd|fs-entry|temporary directory for coverage data|
|[debugKeepBrowserOpen](options/debugKeepBrowserOpen.md)|--debug-keep-browser-open||boolean|keeps the browser open after the tests completed|
|[debugMcpLocalDocs](options/debugMcpLocalDocs.md)|--debug-mcp-local-docs||boolean|use local docs/ directory instead of fetching from GitHub (development only)|
|[dumpConfig](options/dumpConfig.md)|--dump-config||boolean|dump the resolved configuration as JSON and exit|
|[end](options/end.md)|--end||string|command to be executed after the tests|
|[endTimeout](options/endTimeout.md)|--end-timeout||timeout|maximum waiting time for the end command to execute|
|[failFast](options/failFast.md)|--fail-fast|-f|boolean|stop the whole execution after the first failing page|
|[failOpaFast](options/failOpaFast.md)|--fail-opa-fast|-fo|boolean|stop the OPA page execution after the first failing test|
|[globalTimeout](options/globalTimeout.md)|--global-timeout|-t|timeout|limit the tests execution time, fail remaining pages if it takes longer than the timeout|
|[help](options/help.md)|--help||boolean|display help|
|[if](options/if.md)|--if||string|skip execution if the expression evaluates to falsy|
|[keepAlive](options/keepAlive.md)|--keep-alive|-k|boolean|keep the server alive|
|[localhost](options/localhost.md)|--localhost||string|hostname for legacy URL|
|[log](options/log.md)|--log||fs-entry|read and dump log file using jsonl format|
|[logDump](options/logDump.md)|--log-dump||boolean|dump all traces to stdout instead of opening a browser (requires --log)|
|[logFilter](options/logFilter.md)|--log-filter|-lf|string|JavaScript expression (using punyexpr) to filter logs for dumping with --log-dump|
|[mcp](options/mcp.md)|--mcp||boolean|start an MCP server to pilot ui5-test-runner with an MCP client|
|[noNpmInstall](options/noNpmInstall.md)|--no-npm-install||boolean|prevent any NPM install|
|[npmAllowInstallScripts](options/npmAllowInstallScripts.md)|--npm-allow-install-scripts||boolean|allow postinstall scripts when installing missing packages|
|[npmInstall](options/npmInstall.md)|--npm-install||string|npm install strategy for missing packages|
|[npmInstallMinReleaseAge](options/npmInstallMinReleaseAge.md)|--npm-install-min-release-age||integer|minimum release age (in days) required before installing a package|
|[npmInstallPrefix](options/npmInstallPrefix.md)|--npm-install-prefix||fs-entry|path used as --prefix when npmInstall is set to prefix|
|[outputInterval](options/outputInterval.md)|--output-interval|-oi|timeout|interval for reporting progress on non interactive output (CI/CD)|
|[pageFilter](options/pageFilter.md)|--page-filter|-pf|regexp|filter pages to execute|
|[pageParams](options/pageParams.md)|--page-params|-pp|string|add parameters to page URL|
|[pageTimeout](options/pageTimeout.md)|--page-timeout|-pt|timeout|fails a page if it takes longer than this timeout|
|[parallel](options/parallel.md)|--parallel|-p|integer|number of parallel executions|
|[port](options/port.md)|--port||integer|port to use|
|[reportDir](options/reportDir.md)|--report-dir|-r|fs-entry|directory to output test reports|
|[serveOnly](options/serveOnly.md)|--serve-only|-s|boolean|serve only|
|[start](options/start.md)|--start||string|command to be executed before the tests|
|[startTimeout](options/startTimeout.md)|--start-timeout||timeout|maximum waiting time for the start command to become ready|
|[startWaitMethod](options/startWaitMethod.md)|--start-wait-method||string|HTTP method used when polling the startWaitUrl|
|[startWaitUrl](options/startWaitUrl.md)|--start-wait-url||url|URL to poll after the start command is executed|
|[ui5](options/ui5.md)|--ui5||url|UI5 url|
|[url](options/url.md)|--url|-u|url|URL of the page to test|
|[version](options/version.md)|--version||boolean|display version|