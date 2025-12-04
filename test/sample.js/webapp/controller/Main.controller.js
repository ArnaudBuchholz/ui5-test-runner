sap.ui.define([
  './BaseController',
  'sap/m/MessageBox',
  'sap/utr/lib/arithmetics'
], function (
  BaseController,
  MessageBox,
  arithmetics
) {
  'use strict'

  return BaseController.extend('sample.js.controller.Main', {
    sayHello: function () {
      MessageBox.show('The Answer to Life, the Universe and Everything: ' + arithmetics.inc(41))
    }
  })
})
