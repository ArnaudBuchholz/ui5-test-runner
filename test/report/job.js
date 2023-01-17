module.exports = {
  initialCwd: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner',
  browserArgs: [],
  cwd: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner',
  port: 8081,
  ui5: 'https://ui5.sap.com',
  webapp: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\webapp',
  testsuite: 'test/testsuite.qunit.html',
  pageTimeout: 0,
  globalTimeout: 0,
  failFast: false,
  keepAlive: false,
  watch: false,
  logServer: false,
  browser: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\src\\defaults\\puppeteer.js',
  browserCloseTimeout: 2000,
  browserRetry: 1,
  screenshot: true,
  screenshotTimeout: 5000,
  parallel: '2',
  reportDir: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\report',
  coverageSettings: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\src\\defaults\\nyc.json',
  coverageTempDir: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\.nyc_output',
  coverageReportDir: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\coverage',
  coverageReporters: [
    'lcov',
    'cobertura'
  ],
  reportGenerator: [
    'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\src\\defaults\\report.js'
  ],
  progressPage: 'E:\\Nano et Nono\\Arnaud\\dev\\GitHub\\ui5-test-runner\\src\\defaults\\report\\default.html',
  capabilities: false,
  debugMemory: true,
  url: [
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/unitTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/opaTestsComponent.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/opaTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/opaTests.qunit.html'
  ],
  mode: 'url',
  coverage: false,
  libs: [],
  browserCapabilities: {
    modules: {
      puppeteer: 'C:\\Users\\Nano et Nono\\AppData\\Roaming\\npm\\node_modules\\puppeteer'
    },
    screenshot: '.png',
    console: false,
    scripts: true,
    parallel: true,
    traces: [
      'console',
      'network'
    ]
  },
  start: '2023-01-09T12:49:23.648Z',
  testPageUrls: [
    'https://ui5.sap.com/test-resources/sap/m/non_working/unitTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/unitTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTestsNavigation.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/unitTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/opaTestsComponent.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/opaTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/opaTests.qunit.html'
  ],
  qunitPages: {
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/unitTests.qunit.html': {
      id: '7Djd5el7ebc',
      start: '2023-01-09T12:49:34.255Z',
      isOpa: false,
      failed: 0,
      passed: 25,
      count: 25,
      modules: [
        {
          name: 'createDeviceModel',
          tests: [
            {
              name: 'Should initialize a device model for desktop',
              testId: '8ef4ee8b',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'IsPhone property is correct',
                  actual: false,
                  expected: false,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.346Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 3,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/models.js:26:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should initialize a device model for phone',
              testId: '35d36b9d',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'IsPhone property is correct',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.352Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/models.js:30:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should initialize a device model for non touch devices',
              testId: 'e32c4c98',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'IsTouch property is correct',
                  actual: false,
                  expected: false,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.364Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/models.js:45:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should initialize a device model for touch devices',
              testId: '3f38082b',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'IsTouch property is correct',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.384Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/models.js:49:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'The binding mode of the device model should be one way',
              testId: '7a40acae',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Binding mode is correct',
                  actual: 'OneWay',
                  expected: 'OneWay',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.415Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/models.js:53:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'Initialization',
          tests: [
            {
              name: 'Should initialize the List loading promise',
              testId: '91416643',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Did not resolve the promise',
                  actual: 0,
                  expected: 0,
                  negative: false,
                  runtime: 84,
                  todo: false
                },
                {
                  result: true,
                  message: 'Did not reject the promise',
                  actual: 0,
                  expected: 0,
                  negative: false,
                  runtime: 84,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.425Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 99,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/controller/ListSelector.js:17:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'List loading',
          tests: [
            {
              name: 'Should resolve the list loading promise, if the list has items',
              testId: '64d30f33',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Did pass the binding path',
                  actual: {
                    'circular:id': 1,
                    list: {}
                  },
                  expected: {
                    'circular:ref': 1
                  },
                  negative: false,
                  runtime: 2,
                  todo: false
                },
                {
                  result: true,
                  message: 'Did not reject the promise',
                  actual: 0,
                  expected: 0,
                  negative: false,
                  runtime: 2,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.437Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 16,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/controller/ListSelector.js:78:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should reject the list loading promise, if the list has no items',
              testId: 'd048c405',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Did not resolve the promise',
                  actual: 0,
                  expected: 0,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.447Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 18,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/controller/ListSelector.js:94:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'Selecting item in the list',
          tests: [
            {
              name: 'Should select an Item of the list when it is loaded and the binding contexts match',
              testId: 'b6ced4d2',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Did select the list item with a matching binding context',
                  actual: {
                    'circular:id': 1
                  },
                  expected: {
                    'circular:ref': 1
                  },
                  negative: false,
                  runtime: 2,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.454Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 2,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/controller/ListSelector.js:131:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should not select an Item of the list when it is already selected',
              testId: '07ecb0d5',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'did not fail',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.459Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/controller/ListSelector.js:153:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should not select an item of the list when the list has the selection mode none',
              testId: '3741ed6a',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'did not fail',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.465Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/controller/ListSelector.js:172:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'formatter - Currency value',
          tests: [
            {
              name: 'Should round down a 3 digit number',
              testId: '8cb88b78',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The rounding was correct',
                  actual: '3.12',
                  expected: '3.12',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.472Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:19:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should round up a 3 digit number',
              testId: 'b101771f',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The rounding was correct',
                  actual: '3.13',
                  expected: '3.13',
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.479Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:23:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should round a negative number',
              testId: 'd590fa87',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The rounding was correct',
                  actual: '-3.00',
                  expected: '-3.00',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.484Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:27:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should round an empty string',
              testId: 'b557fa89',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The rounding was correct',
                  actual: '',
                  expected: '',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.488Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:31:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should round a zero',
              testId: 'ecfc1f95',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The rounding was correct',
                  actual: '0.00',
                  expected: '0.00',
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.493Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:35:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'formatter - Binary Content',
          tests: [
            {
              name: 'The type metadata is prepended  to the image string when binary date is passed to the formatter',
              testId: 'f42cf009',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The image is formatted correctly',
                  actual: 'data:image/jpeg;base64,',
                  expected: 'data:image/jpeg;base64,',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.499Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:41:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Calling the formatter with no picture content returns the default picture URL',
              testId: 'b84a3eda',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The image is formatted correctly',
                  actual: '../images/Employee.png',
                  expected: '../images/Employee.png',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.505Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:46:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'formatter - Delivery text',
          tests: [
            {
              name: "Should provide the delivery status 'None' for orders with no shipped date",
              testId: 'e56f1d1d',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: 'None',
                  expected: 'None',
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.511Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:72:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: "Should provide the delivery status 'Urgent' for orders with shipped date > required date",
              testId: '81a5044e',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: 1,
                  expected: 1,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.517Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:76:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: "Should provide the delivery status text 'In time' for orders with shipped date > required date",
              testId: '17acda1a',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: 2,
                  expected: 2,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.521Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:80:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: "Should provide the delivery status text 'Too late' for orders with shipped date > required date",
              testId: '9399744e',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: 3,
                  expected: 3,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.526Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:84:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'formatter - Delivery state',
          tests: [
            {
              name: 'Should return "Warning" state for orders with no shipped date',
              testId: '85a5786c',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatter returned the correct state',
                  actual: 'Warning',
                  expected: 'Warning',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.531Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:98:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return "Success" status for orders with shipped date > required date',
              testId: 'c938e81c',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatter returned the correct state',
                  actual: 'Success',
                  expected: 'Success',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.536Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:102:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return "Error" state for orders with shipped date > required date',
              testId: '61a5e6c2',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatter returned the correct state',
                  actual: 'Error',
                  expected: 'Error',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:49:34.541Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/model/formatter.js:106:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        }
      ],
      end: '2023-01-09T12:49:34.679Z',
      report: {
        passed: 27,
        failed: 0,
        total: 27,
        runtime: 162
      }
    },
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTests.qunit.html': {
      id: 'fMxU5xkFf9Q',
      start: '2023-01-09T12:49:34.560Z',
      isOpa: true,
      failed: 0,
      passed: 12,
      count: 12,
      modules: [
        {
          name: 'Desktop not found',
          tests: [
            {
              name: 'Should see the resource not found page when navigating to an invalid hash',
              testId: '7dd0e563',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Shows the message page',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2523,
                  todo: false,
                  screenshot: '7dd0e563-2523.png'
                },
                {
                  result: true,
                  message: 'The not found text is shown as title',
                  actual: 'Not Found',
                  expected: 'Not Found',
                  negative: false,
                  runtime: 2947,
                  todo: false,
                  screenshot: '7dd0e563-2947.png'
                },
                {
                  result: true,
                  message: 'The resource not found text is shown',
                  actual: 'The requested resource was not found',
                  expected: 'The requested resource was not found',
                  negative: false,
                  runtime: 2948,
                  todo: false,
                  screenshot: '7dd0e563-2948.png'
                }
              ],
              end: '2023-01-09T12:49:38.007Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 3,
                total: 3,
                runtime: 3460,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NotFoundJourney.js:13:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see the not found master and detail page if an invalid object id has been called',
              testId: 'afe48f2e',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Shows the message page',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1441,
                  todo: false,
                  screenshot: 'afe48f2e-1441.png'
                },
                {
                  result: true,
                  message: 'The object text is shown as title',
                  actual: 'detailTitle',
                  expected: 'detailTitle',
                  negative: false,
                  runtime: 1869,
                  todo: false,
                  screenshot: 'afe48f2e-1869.png'
                },
                {
                  result: true,
                  message: 'The object not found text is shown',
                  actual: 'This order is not available',
                  expected: 'This order is not available',
                  negative: false,
                  runtime: 1869,
                  todo: false,
                  screenshot: 'afe48f2e-1869.png'
                }
              ],
              end: '2023-01-09T12:49:40.405Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 3,
                total: 3,
                runtime: 2400,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NotFoundJourney.js:29:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see the not found text for no search results',
              testId: '085fbbdc',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'the list should show the no data text for search and filter',
                  actual: 'No matching order found',
                  expected: 'No matching order found',
                  negative: false,
                  runtime: 1780,
                  todo: false,
                  screenshot: '085fbbdc-1780.png'
                }
              ],
              end: '2023-01-09T12:49:42.654Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 2249,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NotFoundJourney.js:41:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'Master List',
          tests: [
            {
              name: 'Should see the master list with all entries',
              testId: '229ef264',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Found the master List',
                  actual: {
                    'ui5:class': 'sap.m.List',
                    'ui5:id': '__component3---master--list'
                  },
                  expected: true,
                  negative: false,
                  runtime: 1342,
                  todo: false,
                  screenshot: '229ef264-1342.png'
                },
                {
                  result: true,
                  message: 'The master list displays all items up to the growing threshold',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1780,
                  todo: false,
                  screenshot: '229ef264-1780.png'
                },
                {
                  result: true,
                  message: 'The master page header displays 10 orders',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2204,
                  todo: false,
                  screenshot: '229ef264-2204.png'
                }
              ],
              end: '2023-01-09T12:49:45.281Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 3,
                total: 3,
                runtime: 2626,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:11:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Search for the First object should deliver results that contain the firstObject in the name',
              testId: 'e594570f',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Every item in the master list contains the text B',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 449,
                  todo: false,
                  screenshot: 'e594570f-449.png'
                }
              ],
              end: '2023-01-09T12:49:46.164Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 884,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:21:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: "Entering something that cannot be found into search field and pressing search field's refresh should leave the list as it was",
              testId: 'efea81cd',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The master list has items',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 868,
                  todo: false,
                  screenshot: 'efea81cd-868.png'
                }
              ],
              end: '2023-01-09T12:49:47.511Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1347,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:30:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: "Entering something that cannot be found into search field and pressing 'search' should display the list's 'not found' message",
              testId: 'f2601a5b',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'the list should show the no data text for search and filter',
                  actual: 'No matching order found',
                  expected: 'No matching order found',
                  negative: false,
                  runtime: 437,
                  todo: false,
                  screenshot: 'f2601a5b-437.png'
                },
                {
                  result: true,
                  message: 'The master page header displays 0 orders',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 857,
                  todo: false,
                  screenshot: 'f2601a5b-857.png'
                }
              ],
              end: '2023-01-09T12:49:48.798Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 1286,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:39:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should display items again if the searchfield is emptied',
              testId: 'f137179b',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The master list displays all items up to the growing threshold',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 443,
                  todo: false,
                  screenshot: 'f137179b-443.png'
                }
              ],
              end: '2023-01-09T12:49:49.662Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 864,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:48:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'MasterList Filtering on Shipped Orders',
              testId: 'e746bbbd',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Master list has been filtered correctly',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1777,
                  todo: false,
                  screenshot: 'e746bbbd-1777.png'
                }
              ],
              end: '2023-01-09T12:49:51.866Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 2202,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:56:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'MasterList remove filter should display all items',
              testId: '3c402f62',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The master list displays all items up to the growing threshold',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1368,
                  todo: false,
                  screenshot: '3c402f62-1368.png'
                }
              ],
              end: '2023-01-09T12:49:53.653Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1788,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:64:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'MasterList grouping created group headers',
              testId: 'c2e96e30',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Master list is grouped',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1376,
                  todo: false,
                  screenshot: 'c2e96e30-1376.png'
                }
              ],
              end: '2023-01-09T12:49:55.507Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1853,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:72:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Remove grouping from MasterList delivers initial list',
              testId: 'b6c1c861',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Master list does not contain a group header',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1385,
                  todo: false,
                  screenshot: 'b6c1c861-1385.png'
                },
                {
                  result: true,
                  message: 'The master list displays all items up to the growing threshold',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1807,
                  todo: false,
                  screenshot: 'b6c1c861-1807.png'
                }
              ],
              end: '2023-01-09T12:49:57.833Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 2325,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/MasterJourney.js:80:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        }
      ],
      end: '2023-01-09T12:49:57.945Z',
      report: {
        passed: 20,
        failed: 0,
        total: 20,
        runtime: 23301
      }
    },
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTestsNavigation.qunit.html': {
      id: 'gxIQLkP29hc',
      start: '2023-01-09T12:49:37.183Z',
      isOpa: true,
      failed: 4,
      passed: 5,
      count: 9,
      modules: [
        {
          name: 'Desktop navigation',
          tests: [
            {
              name: 'Should navigate on press',
              testId: '4e4c29e8',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The list does not have a selected item so nothing can be remembered\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 177 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 4 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nFound control with ID 'list' and controlType 'undefined' in view 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nControl 'Element sap.m.List#__component0---master--list' is not visible -  sap.ui.test.matchers.Visible\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iRememberTheSelectedItem (https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/pages/Master.js:29:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:21:24)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 16932,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '4e4c29e8-16932.png'
                }
              ],
              end: '2023-01-09T12:49:54.377Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 17036,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:14:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should press full screen toggle button: The app shows one column',
              testId: '6f28ca43',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The app shows MidColumnFullScreen layout',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 904,
                  todo: false,
                  screenshot: '6f28ca43-904.png'
                }
              ],
              end: '2023-01-09T12:49:55.546Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1342,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:29:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should press full screen toggle button: The app shows two columns',
              testId: 'bfa94c76',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The app shows TwoColumnsMidExpanded layout',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 501,
                  todo: false,
                  screenshot: 'bfa94c76-501.png'
                }
              ],
              end: '2023-01-09T12:49:56.519Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 973,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:38:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should react on hash change',
              testId: '62d8224b',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The list does not have an item at the index 2\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 369 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 4 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nFound control with ID 'list' and controlType 'undefined' in view 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nControl 'Element sap.m.List#__component0---master--list' is not visible -  sap.ui.test.matchers.Visible\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iRememberTheIdOfListItemAtPosition (https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/pages/Master.js:42:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:49:24)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15241,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '62d8224b-15241.png'
                }
              ],
              end: '2023-01-09T12:50:12.062Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15330,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:47:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate on press ',
              testId: '7b391338',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The list does not have an item at the index 1\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 511 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 4 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nFound control with ID 'list' and controlType 'undefined' in view 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nControl 'Element sap.m.List#__component0---master--list' is not visible -  sap.ui.test.matchers.Visible\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iRememberTheIdOfListItemAtPosition (https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/pages/Master.js:42:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:59:24)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15579,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '7b391338-15579.png'
                }
              ],
              end: '2023-01-09T12:50:27.704Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15669,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:57:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Navigate to an object not on the client: no item should be selected and the object page should be displayed',
              testId: '8542390e',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "the model does not have a item that is not in the list\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 651 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 4 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nFound control with ID 'list' and controlType 'undefined' in view 'sap.ui.demo.orderbrowser.view.Master' -  sap.ui.test.Opa5\nControl 'Element sap.m.List#__component0---master--list' is not visible -  sap.ui.test.matchers.Visible\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iRememberAnIdOfAnObjectThatsNotInTheList (https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/pages/Master.js:56:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:72:24)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15580,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '8542390e-15580.png'
                }
              ],
              end: '2023-01-09T12:50:43.404Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15681,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:70:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should press close column button: The app shows one columns',
              testId: 'ce936e17',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The app shows OneColumn layout',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1304,
                  todo: false,
                  screenshot: 'ce936e17-1304.png'
                },
                {
                  result: true,
                  message: 'The list selection is removed',
                  actual: 0,
                  expected: 0,
                  negative: false,
                  runtime: 1799,
                  todo: false,
                  screenshot: 'ce936e17-1799.png'
                }
              ],
              end: '2023-01-09T12:50:45.586Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 2371,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:79:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Start the App and simulate metadata error: MessageBox should be shown',
              testId: '5c0ad3a5',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The correct MessageBox was shown',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 8307,
                  todo: false,
                  screenshot: '5c0ad3a5-8307.png'
                },
                {
                  result: true,
                  message: 'The MessageBox was closed',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 8765,
                  todo: false,
                  screenshot: '5c0ad3a5-8765.png'
                }
              ],
              end: '2023-01-09T12:50:54.825Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 9236,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:91:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Start the App and simulate bad request error: MessageBox should be shown',
              testId: '94608684',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The correct MessageBox was shown',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 8304,
                  todo: false,
                  screenshot: '94608684-8304.png'
                },
                {
                  result: true,
                  message: 'The MessageBox was closed',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 8779,
                  todo: false,
                  screenshot: '94608684-8779.png'
                }
              ],
              end: '2023-01-09T12:51:04.068Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 9245,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/NavigationJourney.js:108:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        }
      ],
      end: '2023-01-09T12:51:04.261Z',
      report: {
        passed: 8,
        failed: 4,
        total: 12,
        runtime: 86893
      }
    },
    'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/unitTests.qunit.html': {
      id: 'GFXpMswsaDE',
      start: '2023-01-09T12:50:00.885Z',
      isOpa: false,
      failed: 0,
      passed: 39,
      count: 39,
      modules: [
        {
          name: 'price',
          tests: [
            {
              name: 'Should format a number with no digits',
              testId: 'c53f4734',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatting was correct',
                  actual: '123,00',
                  expected: '123,00',
                  negative: false,
                  runtime: 48,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.947Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 49,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:19:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should contain a decimal separator for large numbers',
              testId: '984324df',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatting was correct',
                  actual: '12.345,67',
                  expected: '12.345,67',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.951Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:23:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should round a number with more than 2 digits',
              testId: 'fd214236',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatting was correct',
                  actual: '3,12',
                  expected: '3,12',
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.956Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:27:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should format a negative number properly',
              testId: '5b8ad877',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatting was correct',
                  actual: '-3,00',
                  expected: '-3,00',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.960Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:31:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should format an empty string properly',
              testId: '7bfdcef5',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatting was correct',
                  actual: '0,00',
                  expected: '0,00',
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.965Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:35:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should format a zero properly',
              testId: 'bd74b187',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatting was correct',
                  actual: '0,00',
                  expected: '0,00',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.970Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:39:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'totalPrice',
          tests: [
            {
              name: 'Should multiply the price with the quantity for  1 product',
              testId: 'c309c28f',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct total text was assigned',
                  actual: 'Foo: 246,00',
                  expected: 'Foo: 246,00',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.975Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:62:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should format a quantity of 0 to a total of zero for one product',
              testId: '3a154c85',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct total text was assigned',
                  actual: 'Foo: 0,00',
                  expected: 'Foo: 0,00',
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.979Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:69:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should format two products with quantities and digits to the correct price',
              testId: '702c083e',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct total text was assigned',
                  actual: 'Foo: 1.037,01',
                  expected: 'Foo: 1.037,01',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.983Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:76:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'statusText',
          tests: [
            {
              name: "Should provide the status text 'statusA' for products with status A",
              testId: '45a5a7ec',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: '1',
                  expected: '1',
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.988Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:104:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: "Should provide the status text 'statusO' for products with status O",
              testId: '88042708',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: '2',
                  expected: '2',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.992Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:108:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: "Should provide the status text 'statusD' for products with status D",
              testId: 'c1955572',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: '3',
                  expected: '3',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:00.997Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:112:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should provide the original input for all other values',
              testId: '873a260f',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: 'foo',
                  expected: 'foo',
                  negative: false,
                  runtime: 0,
                  todo: false
                },
                {
                  result: true,
                  message: 'Correct text was assigned',
                  actual: '',
                  expected: '',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.004Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:116:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'statusState',
          tests: [
            {
              name: 'Should return "Success" status for products with status A',
              testId: 'd8f61f57',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatter returned the correct state',
                  actual: 'Success',
                  expected: 'Success',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.009Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:130:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return "Warning" status for products with status A',
              testId: '67e0011e',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatter returned the correct state',
                  actual: 'Warning',
                  expected: 'Warning',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.013Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:133:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return "Error" status for products with status A',
              testId: '584427b2',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatter returned the correct state',
                  actual: 'Error',
                  expected: 'Error',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.018Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:136:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return "None" status for all other statuses',
              testId: '5b06441c',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatter returned the correct state',
                  actual: 'None',
                  expected: 'None',
                  negative: false,
                  runtime: 0,
                  todo: false
                },
                {
                  result: true,
                  message: 'The formatter returned the correct state',
                  actual: 'None',
                  expected: 'None',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.024Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:139:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'pictureUrl',
          tests: [
            {
              name: "Should return the url to a product picture relative to the app's root directory",
              testId: 'a1fc6c0b',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The formatter returned the correct URL',
                  actual: './../../localService/mockdata/images/foo.jpg',
                  expected: './../../localService/mockdata/images/foo.jpg',
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.029Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/formatter.js:146:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'EmailType - parsing',
          tests: [
            {
              name: 'Should throw an error when the E-Mail address is not valid',
              testId: '0b5bf65e',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Should throw an error when the E-Mail address is not valid',
                  actual: {
                    name: 'ValidateException',
                    message: '"inf" is not a valid email address'
                  },
                  expected: null,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.033Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:9:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should throw an error when the E-Mail address is not valid ',
              testId: '6022d582',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Should throw an error was thrown when the E-Mail address is not valid',
                  actual: {
                    name: 'ValidateException',
                    message: '"info.bla" is not a valid email address'
                  },
                  expected: null,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.038Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:16:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should accept the value when it is a valid e-mail address',
              testId: '1e3c436b',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'no exception has happened',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.042Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:23:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should throw an error when the E-Mail address is not valid (edge case: empty field)',
              testId: '87cd1795',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Should throw an error when the E-Mail address is not valid (edge case: empty field)',
                  actual: {
                    name: 'ValidateException',
                    message: '"" is not a valid email address'
                  },
                  expected: null,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.046Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:29:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should throw an error when the E-Mail address is not valid (edge case: blank)',
              testId: 'bdef6288',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Should throw an error when the E-Mail address is not valid (edge case: blank in field)',
                  actual: {
                    name: 'ValidateException',
                    message: '" " is not a valid email address'
                  },
                  expected: null,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.052Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:36:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should throw an error when the E-Mail address is not valid (edge case:no value property)',
              testId: 'de77a5b3',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Should throw an error when the E-Mail address is not valid (edge case:no value property)',
                  actual: {},
                  expected: null,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.056Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:43:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should throw an error when the E-Mail address is not valid (edge case: 5 characters)',
              testId: 'b391af01',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Should throw an error when the E-Mail address is not valid (edge case: 5 characters)',
                  actual: {
                    name: 'ValidateException',
                    message: '"infor" is not a valid email address'
                  },
                  expected: null,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.061Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:50:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should throw an error when the E-Mail address is not valid (edge case: 6 characters, but no valid format)',
              testId: 'c2791649',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Should throw an error when the E-Mail address is not valid (edge case: 6 characters, but no valid format)',
                  actual: {
                    name: 'ValidateException',
                    message: '"in@f.o" is not a valid email address'
                  },
                  expected: null,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.066Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:57:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should accept the value when it is a valid e-mail address ',
              testId: 'a94c2a15',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'no exception has happened (6 characters value)',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.071Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/EmailType.js:64:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'LocalStorageModel - Defaults',
          tests: [
            {
              name: 'Should intialize the local storage model with its defaults',
              testId: '45def3d6',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Default storage key was set',
                  actual: 'LOCALSTORAGE_MODEL',
                  expected: 'LOCALSTORAGE_MODEL',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.075Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/LocalStorageModel.js:11:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'LocalStorageModel - Parameters',
          tests: [
            {
              name: 'Should intialize the local storage model properly',
              testId: '19d363c3',
              skip: false,
              logs: [
                {
                  result: true,
                  message: ' The data was read from the local storage by calling the constructor',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2,
                  todo: false
                },
                {
                  result: true,
                  message: 'The initial data was set on the model',
                  actual: {
                    1: 2,
                    3: 4
                  },
                  expected: {
                    1: 2,
                    3: 4
                  },
                  negative: false,
                  runtime: 2,
                  todo: false
                },
                {
                  result: true,
                  message: 'The size limit on the model has been increased',
                  actual: 1000000,
                  expected: 1000000,
                  negative: false,
                  runtime: 2,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.086Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 3,
                total: 3,
                runtime: 2,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/LocalStorageModel.js:43:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should read the data from the local storage',
              testId: 'be0940b3',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The data was read from the local storage',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1,
                  todo: false
                },
                {
                  result: true,
                  message: 'The custom storage key was used',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.092Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/LocalStorageModel.js:49:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should write the data to the local storage when calling "setProperty" on the model',
              testId: '70233851',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The data was written to the local storage',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2,
                  todo: false
                },
                {
                  result: true,
                  message: 'The custom storage key was used',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.099Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 2,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/LocalStorageModel.js:57:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should write the data to the local storage when calling "setData" on the model',
              testId: 'fafddbe6',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The data was written to the local storage',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2,
                  todo: false
                },
                {
                  result: true,
                  message: 'The custom storage key was used',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.107Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 2,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/LocalStorageModel.js:64:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should write the data to the local storage when calling "refresh" on the model',
              testId: 'd75fb155',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The data was written to the local storage',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1,
                  todo: false
                },
                {
                  result: true,
                  message: 'The custom storage key was used',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.114Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 2,
                total: 2,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/LocalStorageModel.js:71:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'createDeviceModel',
          tests: [
            {
              name: 'Should initialize a device model for desktop',
              testId: '8ef4ee8b',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'IsPhone property is correct',
                  actual: false,
                  expected: false,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.118Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/models.js:27:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should initialize a device model for phone',
              testId: '35d36b9d',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'IsPhone property is correct',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.122Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/models.js:31:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should initialize a device model for non touch devices',
              testId: 'e32c4c98',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'IsTouch property is correct',
                  actual: false,
                  expected: false,
                  negative: false,
                  runtime: 1,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.127Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/models.js:46:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should initialize a device model for touch devices',
              testId: '3f38082b',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'IsTouch property is correct',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.131Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/models.js:50:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'The binding mode of the device model should be one way',
              testId: '7a40acae',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'Binding mode is correct',
                  actual: 'OneWay',
                  expected: 'OneWay',
                  negative: false,
                  runtime: 0,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.135Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 0,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/model/models.js:54:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'CheckoutController',
          tests: [
            {
              name: 'Should check if the destroy function of the message popover is called',
              testId: '8da677a2',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The destroy function has been successfully called',
                  actual: 1,
                  expected: 1,
                  negative: false,
                  runtime: 18,
                  todo: false
                }
              ],
              end: '2023-01-09T12:50:01.140Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 19,
                source: '    at QUnit.test (https://ui5.sap.com/resources/sap/ui/thirdparty/sinon-qunit.js:34:356)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/unit/controller/Checkout.controller.js:37:8\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        }
      ],
      end: '2023-01-09T12:50:01.295Z',
      report: {
        passed: 47,
        failed: 0,
        total: 47,
        runtime: 100
      }
    },
    'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/opaTestsComponent.qunit.html': {
      id: 'kGbWDoPRp7o',
      start: '2023-01-09T12:50:03.704Z',
      isOpa: true,
      failed: 77,
      passed: 3,
      count: 80,
      modules: [
        {
          name: 'Welcome Journey',
          tests: [
            {
              name: 'Should start the app and see the right number of featured products and an avatar button',
              testId: 'adea0613',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The welcome page has two promoted items',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2081,
                  todo: false,
                  screenshot: 'adea0613-2081.png'
                },
                {
                  result: true,
                  message: 'The welcome page has four viewed items',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2512,
                  todo: false,
                  screenshot: 'adea0613-2512.png'
                },
                {
                  result: true,
                  message: 'The welcome page has four favorite items',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 2931,
                  todo: false,
                  screenshot: 'adea0613-2931.png'
                },
                {
                  result: true,
                  message: 'Avatar button is visible',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 3359,
                  todo: false,
                  screenshot: 'adea0613-3359.png'
                }
              ],
              end: '2023-01-09T12:50:07.466Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 4,
                total: 4,
                runtime: 3787,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:26:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should press the product link and navigate to product view',
              testId: 'f0d80ceb',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The product page was successfully displayed',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1346,
                  todo: false,
                  screenshot: 'f0d80ceb-1346.png'
                },
                {
                  result: false,
                  message: "The product list does not contain any entries\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 263 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound control with ID 'productList' and controlType 'undefined' in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.List#__component0---category--productList' is not visible -  sap.ui.test.matchers.Visible\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iShouldSeeSomeEntriesInTheProductList (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:338:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:39:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 16893,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'f0d80ceb-16893.png'
                }
              ],
              end: '2023-01-09T12:50:24.664Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 1,
                total: 2,
                runtime: 16968,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:34:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should press the image and see the LightBox item',
              testId: '430f2fd5',
              skip: true,
              logs: [
                {
                  result: true,
                  message: 'Light Box is visible',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1289,
                  todo: false,
                  screenshot: '430f2fd5-1289.png'
                }
              ],
              end: '2023-01-09T12:50:26.165Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 1721,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:42:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should press the close button and see the product view',
              testId: 'd433f422',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The product page was successfully displayed',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 46,
                  todo: false,
                  screenshot: 'd433f422-46.png'
                }
              ],
              end: '2023-01-09T12:50:26.683Z',
              report: {
                skipped: false,
                todo: false,
                failed: 0,
                passed: 1,
                total: 1,
                runtime: 517,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:49:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should press back button and navigate to welcome view',
              testId: '5894a8e7',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The nav back button was not displayed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 440 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound control with ID 'page' and controlType 'undefined' in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Page#__component0---category--page' is not visible -  sap.ui.test.matchers.Visible\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheBackButtonInCategory (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:165:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:58:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15233,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '5894a8e7-15233.png'
                }
              ],
              end: '2023-01-09T12:50:42.203Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15304,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:56:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should press cart button and see the product in the cart',
              testId: '7e70fad6',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The category list does not contain required selection\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 554 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Home' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Home' -  sap.ui.test.Opa5\nFound 17 controls of type 'sap.m.StandardListItem' in page -  sap.ui.test.Opa5\nFound 16 controls of type sap.m.StandardListItem in view 'sap.ui.demo.cart.view.Home' -  sap.ui.test.Opa5\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-4' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-5' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-6' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-7' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-8' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-9' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-10' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-11' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-12' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-13' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-14' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-15' is not visible -  sap.ui.test.matchers.Visible\n0 out of 16 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheFlatScreensCategory (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Home.js:20:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:65:15)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15484,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '7e70fad6-15484.png'
                }
              ],
              end: '2023-01-09T12:50:57.804Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15609,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/WelcomeJourney.js:63:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'Delete Product Journey',
          tests: [
            {
              name: 'Should see the product list',
              testId: '7ac7c936',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Failure in Opa success function\nException thrown by the testcode:'Error: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\nError: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\n    at Object.start (https://ui5.sap.com/resources/sap/ui/test/launchers/componentLauncher.js:6:215)\n    at s.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:2552)\n    at u.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:5043)\n    at p.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:3983)\n    at n (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:573)\n    at _ (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:506)\n    at https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:961\n    at t (https://ui5.sap.com/resources/sap/ui/test/autowaiter/_timeoutWaiter.js:6:1502)'\nThis is what Opa logged:\nExecute success handler -  sap.ui.test.Opa5",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 920,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '7ac7c936-920.png'
                }
              ],
              end: '2023-01-09T12:50:59.144Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 1200,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:31:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should add a product to the cart and enable the edit button',
              testId: 'b6a4d2eb',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The product list does not contain required selection\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 739 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 118 controls of type 'sap.m.ObjectListItem' in page -  sap.ui.test.Opa5\nFound 3 controls of type sap.m.ObjectListItem in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-2' is not visible -  sap.ui.test.matchers.Visible\n0 out of 3 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheFirstProduct (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:28:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:46:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15689,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'b6a4d2eb-15689.png'
                }
              ],
              end: '2023-01-09T12:51:14.970Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15806,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:44:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see the delete button after pressing the edit button',
              testId: '3d38b53c',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The edit button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 863 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheEditButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Cart.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:58:18)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15677,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '3d38b53c-15677.png'
                }
              ],
              end: '2023-01-09T12:51:30.740Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15791,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:56:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see the confirmation dialog',
              testId: '389aa5ac',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The delete button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1003 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheDeleteButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Cart.js:40:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:66:18)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15692,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '389aa5ac-15692.png'
                }
              ],
              end: '2023-01-09T12:51:46.505Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15804,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:64:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should cancel the delete process',
              testId: 'e2771a44',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The cancel button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1133 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 28 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---app--layout-beginBack' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---app--layout-midForward' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---app--layout-midBack' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---app--layout-endForward' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button7' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button8' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ToggleButton#__button9' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button10' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---product--lightBox-closeButton' is not visible -  sap.ui.test.matchers.Visible\n13 out of 28 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\n0 out of 13 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressCancelOnTheConfirmationDialog (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Dialog.js:28:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:74:20)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15830,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'e2771a44-15830.png'
                }
              ],
              end: '2023-01-09T12:52:02.469Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15949,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:72:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see the edit button',
              testId: '49494d21',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The accept button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1272 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheSaveChangesButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Cart.js:51:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:82:18)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15624,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '49494d21-15624.png'
                }
              ],
              end: '2023-01-09T12:52:18.239Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15738,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:80:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should delete the product from the cart',
              testId: '62a8b31b',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The edit button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1403 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheEditButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Cart.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:90:18)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15635,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '62a8b31b-15635.png'
                }
              ],
              end: '2023-01-09T12:52:33.988Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15752,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:88:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Edit button should be disabled',
              testId: 'cd4912e6',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The accept button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1543 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheSaveChangesButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Cart.js:51:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:100:18)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15599,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'cd4912e6-15599.png'
                }
              ],
              end: '2023-01-09T12:52:49.735Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15733,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/DeleteProductJourney.js:98:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'Navigation Journey',
          tests: [
            {
              name: 'Should start the app and go to the speaker category view',
              testId: 'fa803e30',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Failure in Opa success function\nException thrown by the testcode:'Error: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\nError: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\n    at Object.start (https://ui5.sap.com/resources/sap/ui/test/launchers/componentLauncher.js:6:215)\n    at s.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:2552)\n    at u.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:5043)\n    at p.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:3983)\n    at n (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:573)\n    at _ (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:506)\n    at https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:961\n    at t (https://ui5.sap.com/resources/sap/ui/test/autowaiter/_timeoutWaiter.js:6:1502)'\nThis is what Opa logged:\nExecute success handler -  sap.ui.test.Opa5",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 914,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'fa803e30-914.png'
                }
              ],
              end: '2023-01-09T12:52:50.743Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 1037,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:25:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see the product Blaster Extreme',
              testId: '32caea5f',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The product Blaster Extreme was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1710 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 118 controls of type 'sap.m.ObjectListItem' in page -  sap.ui.test.Opa5\nFound 3 controls of type sap.m.ObjectListItem in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-2' is not visible -  sap.ui.test.matchers.Visible\n0 out of 3 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheProductBlasterExtreme (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:46:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:36:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15748,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '32caea5f-15748.png'
                }
              ],
              end: '2023-01-09T12:53:06.655Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15873,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:34:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate back to home',
              testId: '5b5e39d5',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The nav back button was not displayed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1850 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 5 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound control with ID 'page' and controlType 'undefined' in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Page#__component0---category--page' is not visible -  sap.ui.test.matchers.Visible\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheBackButtonInCategory (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:165:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:43:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15630,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '5b5e39d5-15630.png'
                }
              ],
              end: '2023-01-09T12:53:22.385Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15754,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:41:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to cart',
              testId: '07beaabb',
              skip: false,
              logs: [
                {
                  result: true,
                  message: 'The cart was successfully displayed',
                  actual: true,
                  expected: true,
                  negative: false,
                  runtime: 1015,
                  todo: false,
                  screenshot: '07beaabb-1015.png'
                },
                {
                  result: false,
                  message: "The welcome page was not displayed\nOpa timeout after 30 seconds\nThis is what Opa logged:\nFound 0 blocking out of 2028 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nFound 980 controls in page -  sap.ui.test.Opa5\nFound 222 controls of type undefined in view 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nControl 'Element sap.m.PageAccessibleLandmarkInfo#__info1'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Title#__title0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ToggleButton#__button3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Bar#__bar0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.CustomData#__data1'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__text103' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.VBox#__vbox0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__text104' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.VBox#__vbox1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__text105' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.VBox#__vbox2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__text106' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.VBox#__vbox3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Carousel#__component0---welcomeView--welcomeCarousel' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.CustomData#__data6'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutRow#__row0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data7'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayout#__layout0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Title#__title1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Toolbar#__toolbar0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.CustomData#__data8'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutRow#__component0---welcomeView--promotedRow' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayout#__layout2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Panel#__component0---welcomeView--panelPromoted' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.CustomData#__data11'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Title#__title2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Toolbar#__toolbar1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.CustomData#__data12'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutRow#__component0---welcomeView--viewedRow' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayout#__layout4' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Panel#__component0---welcomeView--panelViewed' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.CustomData#__data15'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Title#__title3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Toolbar#__toolbar2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.CustomData#__data16'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutRow#__component0---welcomeView--favoriteRow' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayout#__layout6' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Panel#__component0---welcomeView--panelFavorite' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.CustomData#__data19'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Page#__component0---welcomeView--page' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button1-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button2-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button3-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__component0---welcomeView--welcomeCarousel-arrowScrollLeft' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__component0---welcomeView--welcomeCarousel-arrowScrollRight' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier0-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier0-__component0---welcomeView--promotedRow-0-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status1-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout1-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box0-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image4-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box1-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data9-__component0---welcomeView--promotedRow-0'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data10-__component0---welcomeView--promotedRow-0'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item2-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item2-__component0---welcomeView--promotedRow-0-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid0-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell1-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data20'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier0-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier0-__component0---welcomeView--promotedRow-1-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status1-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout1-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box0-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image4-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box1-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data9-__component0---welcomeView--promotedRow-1'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data10-__component0---welcomeView--promotedRow-1'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item2-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item2-__component0---welcomeView--promotedRow-1-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid0-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell1-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data21'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier1-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier1-__component0---welcomeView--viewedRow-0-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status2-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout3-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box2-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image5-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box3-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data13-__component0---welcomeView--viewedRow-0'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data14-__component0---welcomeView--viewedRow-0'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item3-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item3-__component0---welcomeView--viewedRow-0-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid1-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell2-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data25'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier1-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier1-__component0---welcomeView--viewedRow-1-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status2-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout3-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box2-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image5-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box3-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data13-__component0---welcomeView--viewedRow-1'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data14-__component0---welcomeView--viewedRow-1'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item3-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item3-__component0---welcomeView--viewedRow-1-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid1-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell2-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data26'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier1-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier1-__component0---welcomeView--viewedRow-2-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status2-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout3-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box2-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image5-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box3-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data13-__component0---welcomeView--viewedRow-2'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data14-__component0---welcomeView--viewedRow-2'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item3-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item3-__component0---welcomeView--viewedRow-2-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid1-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell2-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data27'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier1-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier1-__component0---welcomeView--viewedRow-3-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status2-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout3-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box2-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image5-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box3-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data13-__component0---welcomeView--viewedRow-3'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data14-__component0---welcomeView--viewedRow-3'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item3-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item3-__component0---welcomeView--viewedRow-3-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid1-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell2-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data28'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier2-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier2-__component0---welcomeView--favoriteRow-0-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status3-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout5-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box4-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image6-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box5-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data17-__component0---welcomeView--favoriteRow-0'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data18-__component0---welcomeView--favoriteRow-0'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item4-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item4-__component0---welcomeView--favoriteRow-0-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid2-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell3-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data29'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier2-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier2-__component0---welcomeView--favoriteRow-1-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status3-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout5-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box4-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image6-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box5-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data17-__component0---welcomeView--favoriteRow-1'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data18-__component0---welcomeView--favoriteRow-1'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item4-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item4-__component0---welcomeView--favoriteRow-1-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid2-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell3-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data30'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier2-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier2-__component0---welcomeView--favoriteRow-2-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status3-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout5-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box4-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image6-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box5-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data17-__component0---welcomeView--favoriteRow-2'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data18-__component0---welcomeView--favoriteRow-2'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item4-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item4-__component0---welcomeView--favoriteRow-2-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid2-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell3-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data31'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectIdentifier#__identifier2-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Link#__identifier2-__component0---welcomeView--favoriteRow-3-link' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectStatus#__status3-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.VerticalLayout#__layout5-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box4-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image6-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.FlexBox#__box5-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data17-__component0---welcomeView--favoriteRow-3'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.GridData#__data18-__component0---welcomeView--favoriteRow-3'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item4-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectNumber#__item4-__component0---welcomeView--favoriteRow-3-ObjectNumber' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.Grid#__grid2-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCell#__cell3-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.layout.BlockLayoutCellData#__data32'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button4-__component0---welcomeView--promotedRow-0-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item2-__component0---welcomeView--promotedRow-0-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button4-__component0---welcomeView--promotedRow-1-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item2-__component0---welcomeView--promotedRow-1-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button5-__component0---welcomeView--viewedRow-0-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item3-__component0---welcomeView--viewedRow-0-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button5-__component0---welcomeView--viewedRow-1-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item3-__component0---welcomeView--viewedRow-1-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button5-__component0---welcomeView--viewedRow-2-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item3-__component0---welcomeView--viewedRow-2-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button5-__component0---welcomeView--viewedRow-3-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item3-__component0---welcomeView--viewedRow-3-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button6-__component0---welcomeView--favoriteRow-0-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item4-__component0---welcomeView--favoriteRow-0-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button6-__component0---welcomeView--favoriteRow-1-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item4-__component0---welcomeView--favoriteRow-1-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button6-__component0---welcomeView--favoriteRow-2-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item4-__component0---welcomeView--favoriteRow-2-titleText' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.ui.core.Icon#__button6-__component0---welcomeView--favoriteRow-3-img' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Text#__item4-__component0---welcomeView--favoriteRow-3-titleText' is not visible -  sap.ui.test.matchers.Visible\n0 out of 222 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iShouldSeeTheWelcomePage (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Welcome.js:85:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:54:25)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 31859,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '07beaabb-31859.png'
                }
              ],
              end: '2023-01-09T12:53:54.246Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 1,
                total: 2,
                runtime: 32015,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:49:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate from welcome to product view',
              testId: '36291631',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The cart button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 2158 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 13 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__button1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ToggleButton#__button3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\n0 out of 13 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iToggleTheCart (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Welcome.js:73:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:59:25)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15432,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '36291631-15432.png'
                }
              ],
              end: '2023-01-09T12:54:09.777Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15525,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:57:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate back to home ',
              testId: '106900eb',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The nav back button was not displayed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 2284 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound control with ID 'page' and controlType 'undefined' in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Page#__component0---category--page' is not visible -  sap.ui.test.matchers.Visible\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheBackButtonInCategory (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:165:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:67:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15552,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '106900eb-15552.png'
                }
              ],
              end: '2023-01-09T12:54:25.425Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15659,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:65:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to product view via pressing product image',
              testId: '2f06ab4a',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The product image was not displayed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 2414 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nFound 22 controls of type 'sap.m.Image' in page -  sap.ui.test.Opa5\nFound 14 controls of type sap.m.Image in view 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nControl 'Element sap.m.Image#__image0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image4-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image4-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image5-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image5-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image5-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image5-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image6-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image6-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image6-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Image#__image6-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\n0 out of 14 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheProductImage (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Welcome.js:61:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:75:25)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15490,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '2f06ab4a-15490.png'
                }
              ],
              end: '2023-01-09T12:54:41.079Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15609,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/NavigationJourney.js:73:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'Filter Journey',
          tests: [
            {
              name: 'Should start the app and go to the category view I should see a filter button',
              testId: 'd513276b',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Failure in Opa success function\nException thrown by the testcode:'Error: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\nError: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\n    at Object.start (https://ui5.sap.com/resources/sap/ui/test/launchers/componentLauncher.js:6:215)\n    at s.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:2552)\n    at u.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:5043)\n    at p.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:3983)\n    at n (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:573)\n    at _ (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:506)\n    at https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:961\n    at t (https://ui5.sap.com/resources/sap/ui/test/autowaiter/_timeoutWaiter.js:6:1502)'\nThis is what Opa logged:\nExecute success handler -  sap.ui.test.Opa5",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 515,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'd513276b-515.png'
                }
              ],
              end: '2023-01-09T12:54:41.852Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 740,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:22:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should filter the products on availability',
              testId: '4a1b02ee',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The filter button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 2579 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 2 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\n0 out of 2 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheFilterButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:37:11)\n    at p.iFilterOnAvailability (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:238:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:33:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15732,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '4a1b02ee-15732.png'
                }
              ],
              end: '2023-01-09T12:54:57.735Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15876,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:31:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should remove the availability filters',
              testId: 'f7ca4d58',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The filter button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 2712 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 2 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\n0 out of 2 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheFilterButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:37:11)\n    at p.iRemoveTheAvailabilityFilters (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:269:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:40:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15651,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'f7ca4d58-15651.png'
                }
              ],
              end: '2023-01-09T12:55:13.517Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15794,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:38:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should filter on both availability and price',
              testId: 'e90f2d18',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The filter button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 2837 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 2 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\n0 out of 2 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheFilterButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:37:11)\n    at p.iFilterOnAvailabilityAndPrice (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:251:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:47:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15677,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'e90f2d18-15677.png'
                }
              ],
              end: '2023-01-09T12:55:29.354Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15809,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:45:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should change the price filter and then cancel the change',
              testId: '7e4c1826',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The filter button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 2975 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 2 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\n0 out of 2 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheFilterButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:37:11)\n    at p.iCancelAPriceFilterChange (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:259:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:54:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15766,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '7e4c1826-15766.png'
                }
              ],
              end: '2023-01-09T12:55:45.249Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15902,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:52:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should change the price filter values to the default ones',
              testId: 'eca846fd',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The price filtering option was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 3104 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 17 controls of type 'sap.m.StandardListItem' in page -  sap.ui.test.Opa5\nFound 0 controls of type sap.m.StandardListItem in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iSelectThePriceFilteringOption (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:191:11)\n    at p.iChangeToTheDefaultFilterPriceValues (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:264:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:66:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15668,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'eca846fd-15668.png'
                }
              ],
              end: '2023-01-09T12:56:01.052Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15799,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:64:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should reset price custom filter',
              testId: 'e4907816',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The reset button in the dialog was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 3242 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 2 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\n0 out of 2 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressResetButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:181:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:77:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15761,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'e4907816-15761.png'
                }
              ],
              end: '2023-01-09T12:56:16.963Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15911,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:75:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should filter the products on supplier',
              testId: 'f3caa8df',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The filter button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 3366 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 2 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\n0 out of 2 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheFilterButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:37:11)\n    at p.iFilterOnSupplier (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:245:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:87:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15720,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'f3caa8df-15720.png'
                }
              ],
              end: '2023-01-09T12:56:32.823Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15871,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:85:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should remove the supplier filter',
              testId: '71d36bea',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The filter button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 3504 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 2 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\n0 out of 2 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheFilterButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:37:11)\n    at p.iRemoveTheSupplierFilter (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:275:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:94:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15721,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '71d36bea-15721.png'
                }
              ],
              end: '2023-01-09T12:56:48.781Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15872,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/FilterJourney.js:92:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'Comparison Journey',
          tests: [
            {
              name: 'Should see the product list with Compare link',
              testId: 'e3f71294',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Failure in Opa success function\nException thrown by the testcode:'Error: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\nError: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\n    at Object.start (https://ui5.sap.com/resources/sap/ui/test/launchers/componentLauncher.js:6:215)\n    at s.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:2552)\n    at u.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:5043)\n    at p.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:3983)\n    at n (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:573)\n    at _ (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:506)\n    at https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:961\n    at t (https://ui5.sap.com/resources/sap/ui/test/autowaiter/_timeoutWaiter.js:6:1502)'\nThis is what Opa logged:\nExecute success handler -  sap.ui.test.Opa5",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 916,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'e3f71294-916.png'
                }
              ],
              end: '2023-01-09T12:56:49.765Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 1065,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:31:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see comparison view with one product',
              testId: '99c33c06',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The product list does not contain required selection HT-1254\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 3664 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 115 controls of type 'sap.m.ObjectAttribute' in page -  sap.ui.test.Opa5\nFound 6 controls of type sap.m.ObjectAttribute in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.ObjectAttribute#__attribute1-__component0---category--productList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute2-__component0---category--productList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute1-__component0---category--productList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute2-__component0---category--productList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute1-__component0---category--productList-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute2-__component0---category--productList-2' is not visible -  sap.ui.test.matchers.Visible\n0 out of 6 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnCompareLink (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:281:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:44:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15796,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '99c33c06-15796.png'
                }
              ],
              end: '2023-01-09T12:57:05.743Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15951,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:42:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should add a product to the cart',
              testId: 'da0b89cb',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The press action could not be executed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 3802 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Comparison' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Comparison' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iAddTheDisplayedProductToTheCart (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Comparison.js:37:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:53:24)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15594,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'da0b89cb-15594.png'
                }
              ],
              end: '2023-01-09T12:57:21.462Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15745,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:50:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see comparison view with two products',
              testId: '8c053407',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The cart button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 3927 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Comparison' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Comparison' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iToggleTheCart (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Comparison.js:47:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:64:24)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15567,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '8c053407-15567.png'
                }
              ],
              end: '2023-01-09T12:57:37.210Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15721,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:62:3\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see comparison view with a different second product',
              testId: '36346ff8',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The product list does not contain required selection HT-1137\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 4062 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 115 controls of type 'sap.m.ObjectAttribute' in page -  sap.ui.test.Opa5\nFound 6 controls of type sap.m.ObjectAttribute in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.ObjectAttribute#__attribute1-__component0---category--productList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute2-__component0---category--productList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute1-__component0---category--productList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute2-__component0---category--productList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute1-__component0---category--productList-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectAttribute#__attribute2-__component0---category--productList-2' is not visible -  sap.ui.test.matchers.Visible\n0 out of 6 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnCompareLink (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:281:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:73:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15427,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '36346ff8-15427.png'
                }
              ],
              end: '2023-01-09T12:57:52.779Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15584,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:71:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see comparison view with one product ',
              testId: '9ea444da',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The press action could not be executed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 4193 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Comparison' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Comparison' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iDeleteAProduct (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Comparison.js:26:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:81:24)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15579,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '9ea444da-15579.png'
                }
              ],
              end: '2023-01-09T12:58:08.563Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15755,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/ComparisonJourney.js:79:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        },
        {
          name: 'Buy Product Journey',
          tests: [
            {
              name: 'Should see the category list',
              testId: 'fd61c69e',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Failure in Opa success function\nException thrown by the testcode:'Error: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\nError: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\n    at Object.start (https://ui5.sap.com/resources/sap/ui/test/launchers/componentLauncher.js:6:215)\n    at s.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:2552)\n    at u.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:5043)\n    at p.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:3983)\n    at n (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:573)\n    at _ (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:506)\n    at https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:961\n    at t (https://ui5.sap.com/resources/sap/ui/test/autowaiter/_timeoutWaiter.js:6:1502)'\nThis is what Opa logged:\nExecute success handler -  sap.ui.test.Opa5",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 923,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'fd61c69e-923.png'
                }
              ],
              end: '2023-01-09T12:58:09.614Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 1086,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:27:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see the product list',
              testId: 'd5452151',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The category list does not contain required selection\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 4364 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Home' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Home' -  sap.ui.test.Opa5\nFound 17 controls of type 'sap.m.StandardListItem' in page -  sap.ui.test.Opa5\nFound 16 controls of type sap.m.StandardListItem in view 'sap.ui.demo.cart.view.Home' -  sap.ui.test.Opa5\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-4' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-5' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-6' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-7' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-8' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-9' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-10' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-11' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-12' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-13' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-14' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.StandardListItem#__item1-__component0---homeView--categoryList-15' is not visible -  sap.ui.test.matchers.Visible\n0 out of 16 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheFlatScreensCategory (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Home.js:20:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:39:15)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15501,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'd5452151-15501.png'
                }
              ],
              end: '2023-01-09T12:58:25.310Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15671,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:37:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see an avatar button on the product page',
              testId: 'f14169e9',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The product list does not contain required selection\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 4488 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nFound 120 controls of type 'sap.m.ObjectListItem' in page -  sap.ui.test.Opa5\nFound 3 controls of type sap.m.ObjectListItem in view 'sap.ui.demo.cart.view.Category' -  sap.ui.test.Opa5\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ObjectListItem#__item5-__component0---category--productList-2' is not visible -  sap.ui.test.matchers.Visible\n0 out of 3 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheFirstProduct (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Category.js:28:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:49:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15800,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'f14169e9-15800.png'
                }
              ],
              end: '2023-01-09T12:58:41.258Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15973,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:47:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should add a product to the cart',
              testId: 'c6b10a5f',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The press action could not be executed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 4623 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Product' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Product' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 5 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Product' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__button7' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button8' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ToggleButton#__button9' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button10' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---product--lightBox-closeButton' is not visible -  sap.ui.test.matchers.Visible\n0 out of 5 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iAddTheDisplayedProductToTheCart (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Product.js:30:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:58:21)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15446,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'c6b10a5f-15446.png'
                }
              ],
              end: '2023-01-09T12:58:56.947Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15620,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:55:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should keep the cart when reloading',
              testId: 'fbc7541f',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Failure in Opa success function\nException thrown by the testcode:'Error: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\nError: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\n    at Object.start (https://ui5.sap.com/resources/sap/ui/test/launchers/componentLauncher.js:6:215)\n    at s.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:2552)\n    at u.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:5043)\n    at p.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:3983)\n    at n (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:573)\n    at _ (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:506)\n    at https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:961\n    at t (https://ui5.sap.com/resources/sap/ui/test/autowaiter/_timeoutWaiter.js:6:1502)'\nThis is what Opa logged:\nExecute success handler -  sap.ui.test.Opa5",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 911,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'fbc7541f-911.png'
                }
              ],
              end: '2023-01-09T12:58:58.041Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 1082,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:70:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should start the app with a bookmarkable cart product',
              testId: '8e7e1eb8',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Failure in Opa success function\nException thrown by the testcode:'Error: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\nError: sap.ui.test.launchers.componentLauncher: Start was called twice without teardown. Only one component can be started at a time.\n    at Object.start (https://ui5.sap.com/resources/sap/ui/test/launchers/componentLauncher.js:6:215)\n    at s.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:2552)\n    at u.success (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:5043)\n    at p.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:3983)\n    at n (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:573)\n    at _ (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:506)\n    at https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:961\n    at t (https://ui5.sap.com/resources/sap/ui/test/autowaiter/_timeoutWaiter.js:6:1502)'\nThis is what Opa logged:\nExecute success handler -  sap.ui.test.Opa5",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 924,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '8e7e1eb8-924.png'
                }
              ],
              end: '2023-01-09T12:58:59.351Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 1381,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:87:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to checkout',
              testId: 'c75375c2',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Opa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 4848 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nFound control with ID 'proceedButton' and controlType 'undefined' in view 'sap.ui.demo.cart.view.Cart' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---cartView--proceedButton' is not enabled -  sap.ui.test.matchers._Enabled\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheProceedButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Cart.js:62:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:100:18)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15748,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'c75375c2-15748.png'
                }
              ],
              end: '2023-01-09T12:59:15.180Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15888,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:97:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return to the home',
              testId: 'e268ee69',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Opa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 4981 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheReturnToShopButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:24:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:109:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15595,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'e268ee69-15595.png'
                }
              ],
              end: '2023-01-09T12:59:30.951Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15732,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:106:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return to checkout',
              testId: '00267881',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The cart button was not found and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 5104 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 1 views with viewName 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nFound view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nFound 13 controls of type sap.m.Button in view 'sap.ui.demo.cart.view.Welcome' -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__button1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ToggleButton#__button3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\n0 out of 13 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iToggleTheCart (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Welcome.js:73:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:121:25)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15536,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '00267881-15536.png'
                }
              ],
              end: '2023-01-09T12:59:46.600Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15671,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:118:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Payment Step',
              testId: 'f2dd6b62',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 5237 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:131:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15628,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'f2dd6b62-15628.png'
                }
              ],
              end: '2023-01-09T13:00:02.365Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15762,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:128:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Credit Card Step',
              testId: '98c3d611',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 5362 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:140:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15709,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '98c3d611-15709.png'
                }
              ],
              end: '2023-01-09T13:00:18.238Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15859,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:137:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see Step 4 Button',
              testId: '3991ef7f',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not enter Text on Input with id creditCardHolderName\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 5500 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iEnterCreditCardInformation (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:57:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:149:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15659,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '3991ef7f-15659.png'
                }
              ],
              end: '2023-01-09T13:00:34.032Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15793,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:146:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should not see Step 4 Button when an information is missing',
              testId: '7409cb3f',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not enter Text on Input with id creditCardHolderName\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 5625 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iEnterCreditCardInformation (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:57:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:158:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15686,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '7409cb3f-15686.png'
                }
              ],
              end: '2023-01-09T13:00:49.829Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15813,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:155:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see a message popover window',
              testId: '28a8b376',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The button is not rendered and could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 5758 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheButtonInTheFooter (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:49:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:168:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15639,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '28a8b376-15639.png'
                }
              ],
              end: '2023-01-09T13:01:05.611Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15767,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:165:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should see Step 4 Button ',
              testId: 'f8ac0081',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The message popover close button was not found\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 5881 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 32 controls of type 'sap.m.Button' in page -  sap.ui.test.Opa5\nControl 'Element sap.m.Button#__component0---app--layout-beginBack' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---app--layout-midForward' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---app--layout-midBack' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---app--layout-endForward' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ToggleButton#__button3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6'' is not rendered -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4-__component0---welcomeView--promotedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button4-__component0---welcomeView--promotedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button5-__component0---welcomeView--viewedRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-0' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-1' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-2' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button6-__component0---welcomeView--favoriteRow-3' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button7' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--masterListFilterButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button8' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.ToggleButton#__button9' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__button10' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---category--page-navButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---product--lightBox-closeButton' is not visible -  sap.ui.test.matchers.Visible\nControl 'Element sap.m.Button#__component0---cartView--editButton' is not enabled -  sap.ui.test.matchers._Enabled\nControl 'Element sap.m.Button#__component0---cartView--proceedButton' is not enabled -  sap.ui.test.matchers._Enabled\nControl 'Element sap.m.Button#__component0---cartView--doneButton'' is not rendered -  sap.ui.test.matchers.Visible\n1 out of 32 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nControl 'Element sap.m.Button#__component0---cartView--page-navButton' property 'icon' has value '' but should have value 'sap-icon://decline' -  sap.ui.test.matchers.PropertyStrictEquals\n0 out of 1 controls met the matchers pipeline requirements -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressTheCloseButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:274:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:177:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15596,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'f8ac0081-15596.png'
                }
              ],
              end: '2023-01-09T13:01:21.361Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15756,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:174:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to invoice Step',
              testId: 'ce87a67b',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 6014 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:187:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15771,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'ce87a67b-15771.png'
                }
              ],
              end: '2023-01-09T13:01:37.292Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15924,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:184:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should invalidate Step 5',
              testId: '0864e7a0',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not enter Text invoiceAddressAddress\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 6138 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iEnterInvoiceAddressText (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:127:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:196:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15750,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '0864e7a0-15750.png'
                }
              ],
              end: '2023-01-09T13:01:53.176Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15895,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:193:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should activate Step 5 Button',
              testId: 'df94b30a',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not enter Text invoiceAddressAddress\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 6271 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iEnterInvoiceAddressText (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:127:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:205:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15760,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'df94b30a-15760.png'
                }
              ],
              end: '2023-01-09T13:02:09.094Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15909,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:202:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Delivery Type Step',
              testId: '2de8c862',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 6395 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:214:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15780,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '2de8c862-15780.png'
                }
              ],
              end: '2023-01-09T13:02:25.024Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15929,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:211:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to order summary',
              testId: '32da61d8',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 6528 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:223:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15725,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '32da61d8-15725.png'
                }
              ],
              end: '2023-01-09T13:02:40.905Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15880,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:220:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return to checkout ',
              testId: '04a897bf',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The BacktoList button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 6652 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheEditButtonBacktoList (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:214:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:233:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15748,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '04a897bf-15748.png'
                }
              ],
              end: '2023-01-09T13:02:56.804Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15891,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:230:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should select Bank Transfer',
              testId: '9a4e15d1',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Cannot select Bank Transfer from Payment Methods\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 6790 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheBankTransferButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:247:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:242:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15709,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '9a4e15d1-15709.png'
                }
              ],
              end: '2023-01-09T13:03:12.654Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15866,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:239:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Bank Transfer',
              testId: '92892e53',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 6919 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:251:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15681,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '92892e53-15681.png'
                }
              ],
              end: '2023-01-09T13:03:28.505Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15822,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:248:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to invoice step',
              testId: 'ce96325b',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 7052 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:260:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15735,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'ce96325b-15735.png'
                }
              ],
              end: '2023-01-09T13:03:44.369Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15894,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:257:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Delivery Type Step ',
              testId: '8f3043fe',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 7176 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:270:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15667,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '8f3043fe-15667.png'
                }
              ],
              end: '2023-01-09T13:04:00.219Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15830,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:267:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to order summary ',
              testId: '2871d948',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 7314 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:279:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15683,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '2871d948-15683.png'
                }
              ],
              end: '2023-01-09T13:04:16.071Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15830,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:276:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return to checkout  ',
              testId: '906a6041',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The BackToInvoiceAddress button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 7438 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheEditButtonBackToPaymentType (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:222:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:289:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15708,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '906a6041-15708.png'
                }
              ],
              end: '2023-01-09T13:04:31.938Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15877,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:286:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should select Cash On Delivery',
              testId: 'e02d4806',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Cannot select Cash On Delivery from Payment Methods\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 7571 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheCashOnDeliveryButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:256:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:298:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15723,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'e02d4806-15723.png'
                }
              ],
              end: '2023-01-09T13:04:47.816Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15888,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:295:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Cash On Delivery',
              testId: 'c5364844',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 7695 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:307:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15747,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'c5364844-15747.png'
                }
              ],
              end: '2023-01-09T13:05:03.806Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15960,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:304:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should invalidate Step 4 Button',
              testId: '478292f3',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not enter Text 'cashOnDeliveryName'\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 7830 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iEnterCashOnDeliveryText (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:94:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:316:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15430,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '478292f3-15430.png'
                }
              ],
              end: '2023-01-09T13:05:19.384Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15588,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:313:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should invalidate Step 4 Button ',
              testId: 'a8cfcb8d',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not enter Text 'cashOnDeliveryName'\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 7953 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iEnterCashOnDeliveryText (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:94:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:326:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15450,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'a8cfcb8d-15450.png'
                }
              ],
              end: '2023-01-09T13:05:35.017Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15638,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:323:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should activate Step 4 Button',
              testId: '77b3862b',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not enter Text 'cashOnDeliveryName'\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 8083 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iEnterCashOnDeliveryText (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:94:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:336:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15432,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '77b3862b-15432.png'
                }
              ],
              end: '2023-01-09T13:05:50.631Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15601,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:333:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to invoice Step ',
              testId: '026d2905',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 8212 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:345:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15465,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '026d2905-15465.png'
                }
              ],
              end: '2023-01-09T13:06:06.249Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15634,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:342:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Delivery Type Step  ',
              testId: '56d83be2',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 8347 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:353:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15450,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '56d83be2-15450.png'
                }
              ],
              end: '2023-01-09T13:06:21.865Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15623,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:350:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to order summary  ',
              testId: 'e5c94fd8',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 8472 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:362:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15830,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'e5c94fd8-15830.png'
                }
              ],
              end: '2023-01-09T13:06:37.931Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 16014,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:359:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return to checkout   ',
              testId: '7ce1a7ff',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The BackToPaymentType button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 8607 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheEditButtonBackToInvoiceAddress (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:230:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:371:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15460,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '7ce1a7ff-15460.png'
                }
              ],
              end: '2023-01-09T13:06:53.547Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15646,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:368:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Delivery Address Step',
              testId: '66310d48',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not press Different Delivery Address Checkbox\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 8735 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnDifferentAddressCheckbox (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:41:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:381:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15453,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '66310d48-15453.png'
                }
              ],
              end: '2023-01-09T13:07:09.164Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15631,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:378:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should activate Step 6 Button',
              testId: '4775dfe9',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not enter Text DeliveryAddressAddress\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 8870 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iEnterDeliveryAddressText (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:156:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:390:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15472,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '4775dfe9-15472.png'
                }
              ],
              end: '2023-01-09T13:07:24.819Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15654,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:387:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to Delivery Type Step   ',
              testId: '842f407e',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 8997 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:399:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15457,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '842f407e-15457.png'
                }
              ],
              end: '2023-01-09T13:07:40.529Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15670,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:396:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should navigate to order summary   ',
              testId: 'd360ab48',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not proceed to Next Step\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 9132 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheNextStepButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:408:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15471,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'd360ab48-15471.png'
                }
              ],
              end: '2023-01-09T13:07:56.195Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15662,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:405:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return to checkout    ',
              testId: '1f535801',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The BackToDeliveryType button could not be pressed\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 9260 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheEditButtonBackToDeliveryType (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:238:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:419:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15434,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '1f535801-15434.png'
                }
              ],
              end: '2023-01-09T13:08:11.794Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15625,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:416:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should select Express Delivery and navigate to order summary',
              testId: '0b40f137',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Cannot select express delivery\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 9395 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheExpressDeliveryButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:265:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:429:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15429,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '0b40f137-15429.png'
                }
              ],
              end: '2023-01-09T13:08:27.444Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15616,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:426:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should submit order and navigate to order completed',
              testId: '10483466',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not submit order\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 9524 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.Checkout' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheSubmitButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/Checkout.js:188:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:440:19)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15425,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '10483466-15425.png'
                }
              ],
              end: '2023-01-09T13:08:43.042Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15601,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:437:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Should return to the shop welcome screen',
              testId: '80b83e8a',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Opa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 9659 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 6 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.cart.view.OrderCompleted' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.cart.view.OrderCompleted' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at e.waitFor (https://ui5.sap.com/resources/sap/ui/test/PageObjectFactory.js:6:1145)\n    at p.iPressOnTheReturnToShopButton (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/pages/OrderCompleted.js:13:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:449:25)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15462,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '80b83e8a-15462.png'
                }
              ],
              end: '2023-01-09T13:08:58.741Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15684,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js:446:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        }
      ],
      end: '2023-01-09T13:08:58.956Z',
      report: {
        passed: 8,
        failed: 77,
        total: 85,
        runtime: 1134742
      }
    },
    'https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/opaTests.qunit.html': {
      id: '_0XG99hZVS0',
      start: '2023-01-09T12:51:06.768Z',
      isOpa: true,
      failed: 9,
      passed: 0,
      count: 9,
      modules: [
        {
          name: 'Team Calendar',
          tests: [
            {
              name: 'Should see the Planning Calendar initially set',
              testId: '0f1e2b66',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "The Planning Calendar rows are not equal to the team members\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 159 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'PlanningCalendar' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.thePlanningCalendarShouldHaveAllTeamMembers (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:93:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:33:22)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 16450,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '0f1e2b66-16450.png'
                }
              ],
              end: '2023-01-09T12:51:23.473Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 16548,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:28:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Open a Legend when Planning Calendar is displayed',
              testId: '1fd8f397',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not find the Legend Button of the Calendar\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 274 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'PlanningCalendarLegendButton' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iClickOnALegendButton (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:20:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:40:23)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15601,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '1fd8f397-15601.png'
                }
              ],
              end: '2023-01-09T12:51:39.172Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15698,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:38:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Select a view from the Planning Calendar View Selector',
              testId: 'd55c9389',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not find the View Switch of the Calendar\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 404 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'PlanningCalendar' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iSelectACalendarView (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:37:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:48:23)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15635,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'd55c9389-15635.png'
                }
              ],
              end: '2023-01-09T12:51:54.921Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15733,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:46:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Click on the Planning Calendar Create Button',
              testId: 'a7031bfa',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not find the Create Button\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 526 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'PlanningCalendarCreateAppointmentButton' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iClickOnCreateButton (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:58:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:56:23)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15623,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'a7031bfa-15623.png'
                }
              ],
              end: '2023-01-09T12:52:10.652Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15719,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:54:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Switch to the Single Planning Calendar',
              testId: '925b74cc',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not find Team Member Selector\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 656 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'PlanningCalendarTeamSelector' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iSelectATeamMember (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:68:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:64:23)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15607,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '925b74cc-15607.png'
                }
              ],
              end: '2023-01-09T12:52:26.354Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15709,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:62:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Open a Legend when Single Planning Calendar is displayed',
              testId: 'e3d7db95',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not find the Legend Button of the Calendar\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 778 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'SinglePlanningCalendarLegendButton' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iClickOnALegendButton (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:20:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:74:23)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15561,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'e3d7db95-15561.png'
                }
              ],
              end: '2023-01-09T12:52:42.127Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15691,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:72:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Select a view from the Single Planning Calendar View Selector',
              testId: 'edae9075',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not find the View Switch of the Calendar\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 912 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'SinglePlanningCalendar' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iSelectACalendarView (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:37:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:82:23)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15591,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'edae9075-15591.png'
                }
              ],
              end: '2023-01-09T12:52:57.809Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15683,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:80:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Click on the Single Planning Calendar Create Button',
              testId: '6107e61c',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not find the Create Button\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1034 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'SinglePlanningCalendarCreateAppointmentButton' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iClickOnCreateButton (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:58:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:90:23)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15581,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '6107e61c-15581.png'
                }
              ],
              end: '2023-01-09T12:53:13.536Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15607,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:88:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'Switch back to the Planning Calendar',
              testId: '3802a535',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Could not find Team Member Selector\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 1168 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound no control with the global ID 'SinglePlanningCalendarTeamSelector' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iSelectATeamMember (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/pages/Main.js:68:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:98:23)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15469,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '3802a535-15469.png'
                }
              ],
              end: '2023-01-09T12:53:28.950Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15586,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/m/demokit/teamCalendar/webapp/test/integration/MainJourney.js:96:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        }
      ],
      end: '2023-01-09T12:53:29.142Z',
      report: {
        passed: 0,
        failed: 9,
        total: 9,
        runtime: 141984
      }
    },
    'https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/opaTests.qunit.html': {
      id: 'JjE$q8NMfno',
      start: '2023-01-09T12:53:32.341Z',
      isOpa: true,
      failed: 10,
      passed: 0,
      count: 10,
      modules: [
        {
          name: 'Desktop navigation',
          tests: [
            {
              name: 'should press the error button and see a popover message',
              testId: 'c7b3d5d6',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Unable to load the component with the name: sap.ui.demo.toolpageapp\nFailure in Opa check function\nException thrown by the testcode:'Error: Error while waiting for promise scheduled on flow, details: TypeError: Cannot read properties of undefined (reading 'getResourceBundle')\nTypeError: Cannot read properties of undefined (reading 'getResourceBundle')\n    at p.getBundleTextByModel (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/BaseController.js:49:26)\n    at p.getBundleText (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/App.controller.js:270:16)\n    at p._setToggleButtonTooltip (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/App.controller.js:132:9)\n    at p.onSideNavButtonPress (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/App.controller.js:126:9)\n    at p.onInit (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/App.controller.js:50:10)\n    at i.fireEvent (https://ui5.sap.com/resources/sap-ui-core.js:299:2318)\n    at d.fireEvent (https://ui5.sap.com/resources/sap-ui-core.js:404:4071)\n    at p.fireAfterInit (https://ui5.sap.com/resources/sap-ui-core.js:332:13496)\n    at E (https://ui5.sap.com/resources/sap-ui-core.js:380:1775)\n    at A.runAsOwner (https://ui5.sap.com/resources/sap-ui-core.js:380:5058)\nError: Error while waiting for promise scheduled on flow, details: TypeError: Cannot read properties of undefined (reading 'getResourceBundle')\nTypeError: Cannot read properties of undefined (reading 'getResourceBundle')\n    at p.getBundleTextByModel (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/BaseController.js:49:26)\n    at p.getBundleText (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/App.controller.js:270:16)\n    at p._setToggleButtonTooltip (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/App.controller.js:132:9)\n    at p.onSideNavButtonPress (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/App.controller.js:126:9)\n    at p.onInit (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/controller/App.controller.js:50:10)\n    at i.fireEvent (https://ui5.sap.com/resources/sap-ui-core.js:299:2318)\n    at d.fireEvent (https://ui5.sap.com/resources/sap-ui-core.js:404:4071)\n    at p.fireAfterInit (https://ui5.sap.com/resources/sap-ui-core.js:332:13496)\n    at E (https://ui5.sap.com/resources/sap-ui-core.js:380:1775)\n    at A.runAsOwner (https://ui5.sap.com/resources/sap-ui-core.js:380:5058)\n    at t.check (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:4614)\n    at L._executeCheck (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:6478)\n    at u.check (https://ui5.sap.com/resources/sap/ui/test/Opa5.js:6:4786)\n    at p.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:3689)\n    at n (https://ui5.sap.com/resources/sap/ui/test/Opa.js:6:573)\n    at t (https://ui5.sap.com/resources/sap/ui/test/autowaiter/_timeoutWaiter.js:6:1502)'\nThis is what Opa logged:\nExecuting OPA check function on controls null -  sap.ui.test.Opa5\nCheck function is:\nfunction(){if(!r.started){r.started=true;e.then(function(){r.done=true},function(e){r.errorMessage=\"Error while waiting for promise scheduled on flow\"+(e?\", details: \"+k(e):\"\")})}if(r.errorMessage){throw new Error(r.errorMessage)}else{return!!r.done}} -  sap.ui.test.Opa5",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 1319,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'c7b3d5d6-1319.png'
                }
              ],
              end: '2023-01-09T12:53:33.877Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 1399,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:14:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the notification button and see a popover message',
              testId: '653744c9',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the notification Button on the App page\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 81 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheNotificationButton (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/App.js:37:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:28:21)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15458,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '653744c9-15458.png'
                }
              ],
              end: '2023-01-09T12:53:49.391Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15527,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:25:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the user button and see a popover message',
              testId: '8822d8e9',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the notification Button on the App page\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 137 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheUserButton (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/App.js:46:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:36:21)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15549,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '8822d8e9-15549.png'
                }
              ],
              end: '2023-01-09T12:54:05.028Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15616,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:34:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the settings button and navigate to settings view',
              testId: '8d5d2abd',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the settings button on the sid navigation\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 195 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheSettingsButton (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/App.js:55:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:44:21)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15515,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '8d5d2abd-15515.png'
                }
              ],
              end: '2023-01-09T12:54:20.626Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15596,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:42:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the order settings item and see a toast message',
              testId: 'f8296022',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the order settings item on the master settings page\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 251 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.settings.MasterSettings' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.settings.MasterSettings' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheOrderSettingsItem (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/Settings.js:17:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:52:26)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15472,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'f8296022-15472.png'
                }
              ],
              end: '2023-01-09T12:54:36.145Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15541,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:50:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the save button  and see a toast message',
              testId: '0ab8ee19',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the save button on the detail settings page\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 309 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.settings.DetailSettings' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.settings.DetailSettings' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheSaveButton (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/Settings.js:31:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:60:26)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15428,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '0ab8ee19-15428.png'
                }
              ],
              end: '2023-01-09T12:54:51.644Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15501,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:58:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the cancel button and see a toast message',
              testId: '78000a5c',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the cancel button on the detail settings page\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 365 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.settings.DetailSettings' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.settings.DetailSettings' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheCancelButton (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/Settings.js:42:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:68:26)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15485,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '78000a5c-15485.png'
                }
              ],
              end: '2023-01-09T12:55:07.207Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15544,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:66:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the statistics button and navigate to statistics view',
              testId: 'ae527f3d',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the statistics button on the side navigation\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 423 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheStatisticsButton (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/App.js:69:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:76:21)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15500,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: 'ae527f3d-15500.png'
                }
              ],
              end: '2023-01-09T12:55:22.772Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15575,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:74:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the refresh button',
              testId: '88b3d18c',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the refresh button on the statistics page\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 479 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.Statistics' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.Statistics' -  sap.ui.test.Opa5\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheRefreshButton (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/Statistics.js:25:18)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:85:28)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15478,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '88b3d18c-15478.png'
                }
              ],
              end: '2023-01-09T12:55:38.505Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15538,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:83:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            },
            {
              name: 'should press the home button and navigate to home view',
              testId: '5db19945',
              skip: false,
              logs: [
                {
                  result: false,
                  message: "Did not find the home button on the sid navigation\nOpa timeout after 15 seconds\nThis is what Opa logged:\nFound 0 blocking out of 537 tracked timeouts -  sap.ui.test.autowaiter._timeoutWaiter#hasPending\nAutoWaiter syncpoint -  sap.ui.test.autowaiter._autoWaiter\nFound 1 controls of type 'View' in page -  sap.ui.test.Opa5\nFound 0 views with viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nFound no view with ID 'undefined' and viewName 'sap.ui.demo.toolpageapp.view.App' -  sap.ui.test.Opa5\nNo controls found so matcher pipeline processing was skipped -  sap.ui.test.pipelines.MatcherPipeline\nMatchers found no controls so check function will be skipped -  sap.ui.test.Opa5\nCallstack:\n    at p.iPressTheHomeButton (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/pages/App.js:178:11)\n    at Object.<anonymous> (https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:93:21)\n    at Object.<anonymous> (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1964)\n    at n (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13583)\n    at V.e [as run] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:13406)\n    at https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:16188\n    at Object.P [as advance] (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:10009)",
                  actual: false,
                  expected: true,
                  negative: false,
                  runtime: 15514,
                  todo: false,
                  source: '    at e (https://ui5.sap.com/resources/sap/ui/thirdparty/qunit-2.js:11:21910)',
                  screenshot: '5db19945-15514.png'
                }
              ],
              end: '2023-01-09T12:55:54.265Z',
              report: {
                skipped: false,
                todo: false,
                failed: 1,
                passed: 0,
                total: 1,
                runtime: 15587,
                source: '    at r (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:1787)\n    at o (https://ui5.sap.com/resources/sap/ui/test/opaQunit.js:6:899)\n    at https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/test/integration/NavigationJourney.js:91:2\n    at https://ui5.sap.com/resources/sap-ui-core.js:10:16806'
              }
            }
          ]
        }
      ],
      end: '2023-01-09T12:55:54.544Z',
      report: {
        passed: 0,
        failed: 10,
        total: 10,
        runtime: 141438
      }
    }
  },
  failed: true,
  end: '2023-01-09T13:08:59.075Z',
  testPageHashes: [
    '7Djd5el7ebc',
    'fMxU5xkFf9Q',
    'gxIQLkP29hc',
    'GFXpMswsaDE',
    'kGbWDoPRp7o',
    '_0XG99hZVS0',
    'JjE$q8NMfno'
  ]
}
