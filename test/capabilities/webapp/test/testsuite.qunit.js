sap.ui.define(() => {
  'use strict'

  const tests = {
    'unit/basic': {
      title: 'Basic QUnit'
    },
    'unit/dynamic': {
      title: 'Dynamic includes'
    },
    'unit/localStorage': {
      title: 'Local storage (1)'
    },
    'unit/timerResolution': {
      title: 'Time resolution'
    },
    'unit/timerResolution#250-1250-4': {
      title: 'Time resolution (2)'
    }
  }

  const config = window['ui5-test-runner']?.config ?? {
    parallel: 1
  }

  if (config.parallel > 1) {
    tests['unit/localStorage#2'] = {
      title: 'Local storage (2)'
    }
  }

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
    tests
  }
})
