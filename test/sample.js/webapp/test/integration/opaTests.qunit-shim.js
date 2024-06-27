sap.ui.loader.config({
  shim: {
    'sap/ui/qunit/qunit-junit': {
      deps: ['sap/ui/thirdparty/qunit']
    },
    'sap/ui/qunit/qunit-coverage': {
      deps: ['sap/ui/thirdparty/qunit']
    },
    'sap/ui/thirdparty/sinon-qunit': {
      deps: ['sap/ui/thirdparty/qunit', 'sap/ui/thirdparty/sinon']
    },
    'sap/ui/qunit/sinon-qunit-bridge': {
      deps: ['sap/ui/thirdparty/qunit', 'sap/ui/thirdparty/sinon-4']
    }
  }
})

window.QUnit ??= {}
window.QUnit.config ??= {}
window.QUnit.config.autostart ??= false

sap.ui.require([
  'sap/ui/thirdparty/qunit',
  'sap/ui/qunit/qunit-junit',
  'sap/ui/qunit/qunit-coverage'
], function () {
  sap.ui.require([
    'integration/PageJourney',
    'integration/HelloJourney'
  ], function () {
    QUnit.start()
  })
})
