sap.ui.define(() => {
  'use strict'

  return {
    name: 'QUnit test suite for coverage only/never filtering (declarative)',
    defaults: {
      page: 'ui5://test-resources/samplejs/test.qunit.html?testsuite={suite}&test={name}',
      qunit: {
        version: 2
      },
      sinon: {
        version: 4
      },
      ui5: {
        language: 'EN',
        theme: 'sap_horizon'
      },
      coverage: {
        only: 'controller/',
        never: 'test/'
      }
    },
    tests: {
      'unit/unitTests': {
        title: 'Unit tests for coverage filtering'
      }
    }
  }
})
