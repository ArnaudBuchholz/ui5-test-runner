/* eslint-disable */
window.suite = function () {
	var suite = new parent.jsUnitTestSuite();
	var aParts = location.pathname.match(/(.*\/)(?:[^/]+)/);
	var sContextPath = aParts && aParts[1];
	suite.addTestPage(sContextPath + "unit/unitTests.qunit-v1.html");
	suite.addTestPage(sContextPath + "integration/opaTests.qunit-v1.html");
	return suite;
};
