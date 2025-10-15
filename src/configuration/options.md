|name|short|description|type|multiple|default|defaultLabel|flags
|---|---|---|---|---|---|---|---|
|cwd|c|Set working directory|folder||process.cwd()|current working directory|💻🔗🧪
|version||Shows version|boolean
|help||Shows help|boolean
|capabilities||Run browser tests|boolean||||🧪
|url|u|URL of the testsuite / page to test|url|✅|||🔗
|config||Configuration file|file||'ui5-test-runner.json'||💻🔗🧪
|port|p|Port to use|integer||||💻🔗🧪
|reportDir|r|Directory to output test reports|folder||'report'||💻🔗🧪
|pageTimeout|pt|Limit the page execution time, fails the page if it takes longer than the timeout|timeout||||💻🔗🧪📡
|failFast|f|Stop the execution after the first failing page|boolean||||💻🔗🧪📡
|failOpaFast|fo|Stop the OPA page execution after the first failing test|boolean||||💻🔗🧪📡
|keepAlive|k|Keep the server alive|boolean||||💻🔗🧪📡
|logServer|l|Log inner server traces|boolean||||💻🔗🧪📡
|parallel|p|Number of parallel tests executions|integer||2||💻🔗🧪📡
|browser|b|Browser instantiation command (relative to cwd or use $/ for provided ones)|file||'$/puppeteer.js'||💻🔗🧪📡
|alternateNpmPath||Alternate NPM path to look for packages (priority: local, alternate, global)|folder||||💻🔗📡
|noNpmInstall||Prevent any NPM install (execution may fail if a dependency is missing)'|boolean||||💻🔗🧪📡
|browserCloseTimeout|bt|Maximum waiting time for browser close|timeout||2s||💻🔗🧪📡
|browserRetry|br|Browser instantiation retries : if the command fails unexpectedly, it is re-executed|integer||1||💻🔗🧪📡
|outputInterval|oi|Interval for reporting progress on non interactive output (CI/CD)|timeout||3000||💻🔗🧪📡
|offline||Limit network usage (implies --no-npm-install)|boolean||||💻🔗🧪📡
|env||Set environment variable (syntax: name=value)|string|✅|||💻🔗🧪📡
|localhost||Hostname for legacy URLs and callbacks|string||'localhost'||💣💻🔗🧪📡
|ci||CI mode (no interactive output)|boolean||||💻🔗🧪📡
|deepProbe||Deep probe (recursive, slower)|boolean||||💻🔗🧪📡
|probeParallel||Number of parallel probes (0 to use --parallel)|integer||||💻🔗🧪📡
|webapp||Base folder of the web application|folder||||💻🔗
|pageFilter|pf|Filter out pages not matching the regexp|regexp||||💻🔗📡
|pageParams|pp|Add parameters to page URL|string||||💻🔗📡
|pageCloseTimeout||Maximum waiting time for page to close|timeout||250||💻🔗📡
|globalTimeout|t|Limit the tests execution time, fail remaining pages if it takes longer than the timeout|timeout||||💻🔗📡
|screenshot||Take screenshots during the tests execution (if supported by the browser)|boolean||||💻🔗📡
|noScreenshot||Disable screenshots during the tests execution (but not on failure, see --screenshot-on-failure)|boolean||||💻🔗📡
|screenshotOnFailure||Take a screenshot when a test fails (even if --screenshot is false)|boolean||true||💻🔗📡
|screenshotTimeout|st|Maximum waiting time for browser screenshot|timeout||5000||💻🔗📡
|splitOpa|so|Split OPA tests using QUnit modules|boolean||||💻🔗📡
|reportGenerator|rg|Report generator paths (relative to cwd or use $/ for provided ones)|file|✅|['$/report.js']|Standard report generator|💻🔗📡
|jest||Simulate jest environment|boolean||||🥼💻🔗📡
|qunitBatchSize||QUnit hooks batch size (disables screenshots)|integer||||🥼💻🔗📡
|coverage||Enable or disable code coverage|boolean||||💻🔗📡
|noCoverage||Disable code coverage|boolean||||💻🔗📡
|coverageSettings|cs|Path to a custom .nycrc.json file providing settings for instrumentation|file||'$/.nycrc.json'||💻🔗📡
|coverageTempDir|ctd|Directory to output raw coverage information to|folder||'.nyc_output'||💻🔗
|coverageReportDir|crd|Directory to store the coverage report files|folder||'.coverage'||💻🔗
|coverageReporters|cr|List of nyc reporters to use (text is always used)|string|✅|['lcov', 'cobertura']||💻🔗📡
|coverageCheckBranches|ccb|What % of branches must be covered|percent||||💻🔗📡
|coverageCheckFunctions|ccf|What % of functions must be covered|percent||||💻🔗📡
|coverageCheckLines|ccl|What % of lines must be covered|percent||||💻🔗📡
|coverageCheckStatements|ccs|What % of statements must be covered|percent||||💻🔗📡
|coverageRemoteScanner|crs|Scanner to get source files when all coverage is requested|file||'$/scan-ui5.js'||💻🔗📡
|serveOnly|s|Serve only|boolean||||💻🔗
|watch|w|Monitor the webapp folder (or the one specified with --watch-folder) and re-execute tests on change|boolean||||💻🔗
|watchFolder||Folder to monitor with watch (enables --watch if not specified)|folder||||💻🔗
|start||Start command (might be an NPM script or a shell command) ⚠️ the command is killed on tests completion|string||||💻🔗
|startWaitUrl||URL to wait for (🔗 defaulted to first url)|url||||💻🔗
|startWaitMethod||HTTP method to check the waited URL|string||'GET'||💻🔗
|startTimeout||Maximum waiting time for the start command (based on when the first URL becomes available, also used for termination)|timeout||5000||💻🔗
|end||End script (will receive path to `job.json`)|string||||💻🔗
|endTimeout||Maximum waiting time for the end script|timeout||5000||💻🔗
|ui5||UI5 url|url||'https://ui5.sap.com'||💻📡
|disableUi5||Disable UI5 mapping (also disable libs)|boolean||||💻📡
|libs||UI5 library mapping (<relative>=<path> or <path>)|ui5Mapping|✅|||💻📡
|mappings||REserve custom mapping (<match>=<file\|url>(<config>))|reserveMapping|✅|||💻📡
|cache||Cache UI5 resources locally in the given folder|folder||||💻📡
|preload||Preload UI5 libraries in the cache folder (only if --cache is used)|string|✅|||💻📡
|testsuite||Path of the testsuite file (relative to webapp, URL parameters are supported)|file||'test/testsuite.qunit.html'||💻

    // Specific to coverage in url mode (experimental)
    .option('-cp, --coverage-proxy [flag]', `[🔗] ${EXPERIMENTAL_OPTION} use internal proxy to instrument remote files`, boolean, false)
    .option('-cpi, --coverage-proxy-include <regexp>', `[🔗] ${EXPERIMENTAL_OPTION} urls to instrument for coverage`, regex, '.*')
    .option('-cpe, --coverage-proxy-exclude <regexp>', `[🔗] ${EXPERIMENTAL_OPTION} urls to ignore for coverage`, regex, '/((test-)?resources|tests?)/')

    // Batch mode related
    .addOption(new Option('--batch-mode', 'Changes the way options are defaulted (in particular coverage temporary folders)', boolean).hideHelp())
    .option('--batch <specification...>', 'Batch specification', arrayOf(string))
    .option('--batch-id <id>', 'Batch id (used for naming report folder)', string)
    .option('--batch-label <label>', 'Batch label (used while reporting on execution)', string)
    .option('--if <condition>', 'Condition runner execution', string)

|name|short|description|type|multiple|default|defaultLabel|flags
|---|---|---|---|---|---|---|---|
|debugDevMode|||boolean||||🐞
|debugProbeOnly|||boolean||||🐞
|debugKeepBrowserOpen|||boolean||||🐞
|debugMemory|||boolean||||🐞
|debugHandles|||boolean||||🐞
|debugKeepReport|||boolean||||🐞
|debugCapabilitiesTest|||boolean||||🐞
|debugCapabilitiesNoTimeout|||boolean||||🐞
|debugCapabilitiesNoScript|||boolean||||🐞
|debugCoverageNoCustomFs|||boolean||||🐞
|debugVerbose|||string|✅|||🐞
