sap.ui.getCore().attachInit(function () {
  'use strict'

  // The agent installs the jest globals (describe/test/expect/jest) and exposes
  // jestStart once ready. Wait for it before loading the spec, since the spec
  // calls those globals at module evaluation time, then start the run.
  var whenAgentReady = function (callback) {
    var runner = window['ui5-test-runner']
    if (runner && typeof runner.jestStart === 'function') {
      callback(runner)
    } else {
      setTimeout(function () {
        whenAgentReady(callback)
      }, 50)
    }
  }

  whenAgentReady(function (runner) {
    sap.ui.require(['unit/jest.spec'], function () {
      runner.jestStart()
    })
  })
})
