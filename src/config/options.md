|name|short|description|type|multiple|default|defaultLabel|
|---|---|---|---|---|---|---|
|cwd|c|Set working directory|folder||process.cwd()|current working directory|
|version||Shows version|boolean
|help||Shows help|boolean
|capabilities||Run browser tests|boolean
|url|u|URL of the testsuite / page to test|url|✅
|config||Configuration file|file||'ui5-test-runner.json'
|port|p|Port to use|integer
|reportDir|r|Directory to output test reports|folder||'report'
|pageTimeout|pt|Limit the page execution time, fails the page if it takes longer than the timeout|timeout
|failFast|f|Stop the execution after the first failing page|boolean
|failOpaFast|fo|Stop the OPA page execution after the first failing test|boolean
|keepAlive|k|Keep the server alive|boolean
|logServer|l|Log inner server traces|boolean
|parallel|p|Number of parallel tests executions|integer||2
|browser|b|Browser instantiation command (relative to cwd or use $/ for provided ones)|file||'$/puppeteer.js'
|alternateNpmPath||Alternate NPM path to look for packages (priority: local, alternate, global)|folder
|noNpmInstall||Prevent any NPM install (execution may fail if a dependency is missing)'|boolean
|browserCloseTimeout|bt|Maximum waiting time for browser close|timeout||2s
|browserRetry|br|Browser instantiation retries : if the command fails unexpectedly, it is re-executed|integer||1
