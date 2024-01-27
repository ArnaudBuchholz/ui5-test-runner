sap.ui.define([
  'sap/ui/core/mvc/XMLView'
], function (XMLView) {
  'use strict'

  XMLView.create({ viewName: 'auth.sample.js.App' })
    .then(function (view) {
      view.placeAt('content')
    })
})
