sap.ui.define(['sap/ui/test/opaQunit', './pages/Main'], function () {
  'use strict'

  QUnit.module('Sample Page Journey')

  opaTest('Should have an hello button', function (Given, When, Then) {
    // Arrangements
    Given.iStartMyUIComponent({
      componentConfig: {
        name: 'sample.js'
      }
    })

    // Assertions
    Then.onTheMainPage.iShouldSeeTheHelloButton()

    // Cleanup
    Then.iTeardownMyApp()
  })
})
