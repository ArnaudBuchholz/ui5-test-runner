/* eslint-disable */
window.suite = function () {
	var suite = new parent.jsUnitTestSuite();
	var parts = location.pathname.match(/(.*\/)(?:[^/]+)/);
	var contextPath = parts && parts[1];
	suite.addTestPage(contextPath + "unit/unitTests.qunit.html", {
		coverage: {
			only: "controller/",
			never: "test/"
		}
	});
	return suite;
};
