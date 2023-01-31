window.suite = function () {
  'use strict'
  const suite = new window.parent.jsUnitTestSuite() // eslint-disable-line new-cap
  const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)
  suite.addTestPage(`${path}unit/unitTests.qunit.html`)
  suite.addTestPage(`${path}integration/opaTests.iframe.qunit.html`)
  return suite
}
