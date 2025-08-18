/* global QUnit */

// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false

sap.ui.getCore().attachInit(function () {
  'use strict'

  sap.ui.require(['unit/jest.spec'], function () {
    if (!QUnit.config.started) {
      QUnit.start()
    }
  })
})
