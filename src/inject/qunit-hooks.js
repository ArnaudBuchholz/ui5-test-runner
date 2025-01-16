/* Injected QUnit hooks */
(function () {
  'use strict'

  const MODULE = 'ui5-test-runner/qunit-hooks'
  if (window[MODULE]) {
    return // already installed
  }
  window[MODULE] = true

  const post = window['ui5-test-runner/post']

  function isOpa () {
    try {
      return !!window.sap.ui.test.Opa5
    } catch (e) {
      return false
    }
  }

  function getModules () {
    if (QUnit.config && QUnit.config.modules) {
      return QUnit.config.modules.map(({ name, moduleId, tests }) => ({
        name,
        moduleId,
        tests: tests.map(({ name, testId, skip }) => ({ name, testId, skip }))
      }))
    }
    return []
  }

  function extend (details) {
    details.isOpa = isOpa()
    details.modules = getModules()
    return details
  }

  function installQUnitHooks () {
    QUnit.begin(function (details) {
      details.isOpa = isOpa()
      return post('QUnit/begin', details)
    })

    QUnit.testStart(function (details) {
      return post('QUnit/testStart', extend(details))
    })

    QUnit.log(function (log) {
      let ready = false
      post('QUnit/log', extend(log))
        .then(undefined, function () {
          console.error('Failed to POST to QUnit/log (no timestamp)', log)
        })
        .then(function () {
          ready = true
        })
      if (isOpa()) {
        window.sap.ui.test.Opa5.prototype.waitFor({
          timeout: 10,
          autoWait: false, // Ignore interactable constraint
          check: function () {
            return ready
          }
        })
      }
    })

    QUnit.testDone(function (report) {
      return post('QUnit/testDone', report)
    })

    QUnit.done(function (report) {
      if (window.__coverage__) {
        report.__coverage__ = window.__coverage__
      }
      return post('QUnit/done', report)
    })
  }

  if (typeof window.QUnit !== 'undefined' && QUnit.begin) {
    installQUnitHooks()
  } else {
    let QUnit
    let install = true

    Object.defineProperty(window, 'QUnit', {
      get: function () {
        return QUnit
      },

      set: function (value) {
        QUnit = value
        if (QUnit && QUnit.begin && install) {
          installQUnitHooks()
          install = false
        }
      }
    })
  }
}())
