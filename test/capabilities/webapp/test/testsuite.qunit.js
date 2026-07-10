sap.ui.define(() => {
  'use strict'

  return {
    name: 'QUnit test suite for the UI5 Test Runner',
    defaults: {
      page: 'ui5://test-resources/capabilities/test.qunit.html?testsuite={suite}&test={name}',
      qunit: {
        version: 2
      },
      sinon: {
        version: 4
      },
      ui5: {
        language: 'EN',
        theme: 'sap_horizon'
      }
    },
    tests: {
      'unit/basic': {
        title: 'Basic QUnit'
      },
      'unit/dynamic': {
        title: 'Dynamic includes'
      },
      'unit/localStorage': {
        title: 'Local storage (1)'
      },
      // Only if complete isolation is used (i.e. separate windows)
      // 'unit/localStorage#2': {
      //   title: 'Local storage (2)'
      // },
    }
  }
})
