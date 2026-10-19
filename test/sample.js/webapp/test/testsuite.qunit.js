/* eslint-disable */
window.suite = function () {
	var suite = new parent.jsUnitTestSuite();
	var parts = location.pathname.match(/(.*\/)(?:[^/]+)/);
	var contextPath = parts && parts[1];
	suite.addTestPage(contextPath + "unit/unitTests.qunit.html" + location.search);
	suite.addTestPage(contextPath + "integration/opaTests.qunit.html" + location.search);
	return suite;
};
