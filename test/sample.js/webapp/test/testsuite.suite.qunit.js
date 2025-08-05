sap.ui.define(() => {
	"use strict";

	return {
		name: "QUnit test suite for the UI5 Application: sample.js",
		defaults: {
			page: "ui5://test-resources/samplejs/test.qunit.html?testsuite={suite}&test={name}",
			qunit: {
				version: 2
			},
			sinon: {
				version: 4
			},
			ui5: {
				language: "EN",
				theme: "sap_horizon"
			},
		},
		tests: {
			"unit/unitTests": {
				title: "Unit tests for samples.js"
			},
			"integration/opaTests": {
				title: "OPA tests for samples.js"
			}
		}
	};
});
