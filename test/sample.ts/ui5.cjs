/**
 * 'Hack' to run @ui5/cli with the correct cwd (or transpiling fails)
 * DO NOT REPLICATE SINCE THIS PROJECT HAS A VERY SPECIFIC CONFIGURATION
 */
const NODE_ENV = process.env.NODE_ENV
process.env.NODE_ENV = 'test'
const UI5_CLI_TEST_BIN_RUN_MAIN = process.env.UI5_CLI_TEST_BIN_RUN_MAIN
process.env.UI5_CLI_TEST_BIN_RUN_MAIN = 'false'
const ui5 = require('@ui5/cli/bin/ui5.cjs')
process.env.NODE_ENV = NODE_ENV ?? ''
process.env.UI5_CLI_TEST_BIN_RUN_MAIN = UI5_CLI_TEST_BIN_RUN_MAIN ?? ''
ui5.main().catch((err) => {
  console.log('Fatal Error: Unable to initialize UI5 CLI')
  console.log(err)
  process.exit(1)
})
