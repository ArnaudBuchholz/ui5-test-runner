# Mapping v1 settings to v2

* v1 syntax is `-<exampleOption>:<value>`, configuration file keys are identical
* v2 syntax is `--<example-option>` `<value>`, configuration file keys are using [lowerCamelCase](https://wiki.c2.com/?LowerCamelCase) (`exampleOption`)

Incompatible options are flagged with

| v1 | v2 | configuration file |
|---|---|---|
|-cwd|-c, --cwd|cwd|
|-port|--port|port|
|-ui5|--ui5|ui5|
|-libs|--libs|libs|
|-cache|--cache|cache|
|-webapp|--webapp|webapp|
|-testsuite|--testsuite|testsuite|
|-pageFilter|-pf, --page-filter|pageFilter|
|-pageParams|-pp, --page-params|pageParams|
|-pageTimeout|-pt, --page-timeout|pageTimeout|
|-globalTimeout|-t, --global-timeout|globalTimeout|
|-failFast|-f, --fail-fast|failFast|
|-keepAlive|-k, --keep-alive|keepAlive|
|-watch|-w, --watch|watch|
|-logServer|-l, --log-server|logServer|
|-browser|-b, --browser|browser|
|-browserRetry|-br, --browser-retry|browserRetry|
|-noScreenshot|--screenshot false, --no-screenshot|noScreenshot|
|-args|--|browserArgs🚫|
|-parallel|-p, --parallel|parallel|
|-tstReportDir|-r, --report-dir|reportDir🚫|
|-coverage|--coverage, --no-coverage|coverage|
|-covSettings|-cs, --coverage-settings|coverageSettings🚫|
|-covTempDir|-ct, --coverage-temp-dir|coverageTempDir🚫|
|-covReportDir|-cr, --coverage-report-dir|coverageReportDir🚫|
|-covReporters|-cr, --coverage-reporters|coverageReporters🚫|
