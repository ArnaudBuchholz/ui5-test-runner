sap.ui.define(['sap/ui/test/opaQunit', './pages/Main'], function () {
  'use strict'

  QUnit.module('Sample Basic Auth Journey')

  opaTest('Should test basic auth', function (Given, When, Then) {
    // Arrangements
    Given.iStartMyAppInAFrame({
      source: '../../index.html'
    })

    // Actions
    When.onTheMainPage.iPressTheSayHelloButton()

    // Assertions
    Then.onTheMainPage.iShouldSeeTheHelloDialog()

    // Cleanup
    Then.iTeardownMyApp()
  })
})
