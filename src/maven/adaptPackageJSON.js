"use strict";

const _package = require("../../../../package.json");
const _localPackage = require("../package.json");

const helper = require("./util/helper");
const c = require("./util/constant");
const fs = require("fs");
const yaml = require("js-yaml");

const YAML_TEMPLATE =
{
    specVersion: "2.4",
    metadata: {
        name: "ui5-test-runner"
    },
    type: "application",
    server: {
        customMiddleware: [
            {
                name: "fiori-tools-appreload",
                afterMiddleware: "compression",
                configuration: {
                    port: 35729,
                    path: "webapp",
                    delay: 300
                }
            },
            {
                name: "@ui5/middleware-code-coverage",
                afterMiddleware: "compression",
                configuration: {
                    instrument: {
                        produceSourceMap: true,
                        coverageGlobalScope: "window.top",
                        coverageGlobalScopeFunc: false
                    },
                    excludePatterns: [
                        "test/",
                        "resources/"
                    ]
                }
            }
        ]
    }
};


const YAML_LIB_TEMPLATE =
{
    name: "ui5-middleware-servestatic",
    afterMiddleware: "compression",
    mountPath: "/resources/my/dev/common/",
    configuration: {
        rootPath: `"./${c.DEST_PATH}/my.dev.common"`
    }
};

async function _adaptPackageJson({ aModuleMapping, oConfig } = {}) {
    console.log(`${helper.incrementLogIndex()}. Adding new npm script for ui5-test-runner`);
    let oUI5PathResource = {
        path: "/resources",
        src: "" 
    };

    let oUI5PathTestResource = {
        path: "/test-resources",
        src: ""
    };
    let oYAMLUI5 =
    {
        name: "fiori-tools-servestatic",
        afterMiddleware: "compression",
        configuration: {
            paths:
                []
        }
    };

    let packageJSON = _package || {};
    if (!packageJSON.scripts) {
        packageJSON.scripts = {};
    }
    const SCRIPT_PREFIX = "npx ui5-test-runner -p 5 --report-generator $/report.js $/junit-xml-report.js -so --coverage";

    if (oConfig.useUI5TestRunnerServer) {

        for (let index = 0; index < aModuleMapping.length; index++) {
            const moduleMapping = aModuleMapping[index];
            SCRIPT_PREFIX = `${SCRIPT_PREFIX} --libs ${moduleMapping.lib}/=${moduleMapping.path}/`;
        }
        let script = `${SCRIPT_PREFIX} --ui5 ${oConfig.UI5.url} -cr lcov -cs nyc.json`;


        packageJSON.scripts["ui5-test-runner-via-serve"] = script;

        let oNYC = {
            "all": true,
            "sourceMap": false,
            "include": [
                "**/webapp/**"
            ],
            "exclude": [
                "**/webapp/test/**",
                "**/webapp/localService/**"
            ]
        };
        try {
            await fs.promises.writeFile(
                "./nyc.json", JSON.stringify(oNYC));
        } catch (e) {
            console.log(`└── Failed to create a custom nyc.json file providing settings for instrumentation: ${e}`);
        }
        console.log("└── Successfully created a custom nyc.json file providing settings for instrumentation");
    }
    else {
        packageJSON.scripts["ui5-test-runner-via-UI5Tooling-serve"] = "npx fiori run --config ./ui5-test-runner.yaml";
        packageJSON.scripts["ui5-test-runner-via-UI5Tooling-test"] = `${SCRIPT_PREFIX} --url http://localhost:8080/test/testsuite.qunit.html`;
        packageJSON.scripts["ui5-test-runner-via-UI5Tooling"] = "start-server-and-test ui5-test-runner-via-UI5Tooling-serve http://localhost:8080 ui5-test-runner-via-UI5Tooling-test";
        let oUI5TestRunnerJSON = Object.assign({}, YAML_TEMPLATE);

        for (let index = 0; index < aModuleMapping.length; index++) {
            const moduleMapping = aModuleMapping[index];
            let oLibYAML = { ...YAML_LIB_TEMPLATE };

            oLibYAML.mountPath = `/resources/${moduleMapping.lib}/`;
            oLibYAML.configuration.rootPath = `${moduleMapping.path}`;
            oUI5TestRunnerJSON.server.customMiddleware.push(oLibYAML);
        }
        oUI5PathResource.src = `${c.DEST_PATH}/${oConfig.UI5.version}/resources`;
        oUI5PathTestResource.src = `${c.DEST_PATH}/${oConfig.UI5.version}/test-resources`;
        oYAMLUI5.configuration.paths.push(oUI5PathResource);
        oYAMLUI5.configuration.paths.push(oUI5PathTestResource);
        oUI5TestRunnerJSON.server.customMiddleware.push(oYAMLUI5);

        const oUI5TestRunnerYAML = yaml.dump(oUI5TestRunnerJSON);

        try {
            await fs.promises.writeFile(
                "./ui5-test-runner.yaml", oUI5TestRunnerYAML);
        } catch (e) {
            console.log(`└── Failed to update the ui5-test-runner.yaml with the new script: ${e}`);
        }
    }

    packageJSON = _adjustPackageDependency(packageJSON);
    try {
        await fs.promises.writeFile(
            "./package.json", JSON.stringify(packageJSON));
    } catch (e) {
        console.log(`└── Failed to update the package.json with the new script: ${e}`);
    }
    console.log("└── Successfully added the new npm script");

}

function _adjustPackageDependency(oPackage) {
    if (!oPackage.devDependencies) {
        oPackage.devDependencies = {};
    }

    if (!oPackage.devDependencies["ui5-middleware-servestatic"]) {
        oPackage.devDependencies["ui5-middleware-servestatic"] = "";
    }
    if (!oPackage.devDependencies["ui5-middleware-simpleproxy"]) {
        oPackage.devDependencies["ui5-middleware-simpleproxy"] = "";
    }
    if (!oPackage.devDependencies["@ui5/middleware-code-coverage"]) {
        oPackage.devDependencies["@ui5/middleware-code-coverage"] = "";
    }
    if (!oPackage.devDependencies["@sap/ux-ui5-tooling"]) {
        oPackage.devDependencies["@sap/ux-ui5-tooling"] = "";
    }

    oPackage.devDependencies["ui5-middleware-servestatic"] = _localPackage.dependencies["ui5-middleware-servestatic"];
    oPackage.devDependencies["ui5-middleware-simpleproxy"] = _localPackage.dependencies["ui5-middleware-simpleproxy"];
    oPackage.devDependencies["@ui5/middleware-code-coverage"] = _localPackage.dependencies["@ui5/middleware-code-coverage"];
    oPackage.devDependencies["@sap/ux-ui5-tooling"] = _localPackage.dependencies["@sap/ux-ui5-tooling"];

    if (!oPackage.ui5) {
        oPackage.ui5 = {};
    }
    if (!oPackage.ui5.dependencies) {
        oPackage.ui5.dependencies = [];
    }
    if (oPackage.ui5.dependencies.indexOf("@sap/ux-ui5-tooling") === -1) {
        oPackage.ui5.dependencies.push("@sap/ux-ui5-tooling");
    }

    if (oPackage.ui5.dependencies.indexOf("ui5-middleware-servestatic") === -1) {
        oPackage.ui5.dependencies.push("ui5-middleware-servestatic");
    }

    if (!oPackage.name) {
        oPackage.name = "prep-env-ui5-test-runner";
    }
    if (!oPackage.version) {
        oPackage.version = "0.0.1";
    }
    return oPackage;
}


module.exports = {
    adaptPackageJson: async ({ aModuleMapping, oConfig } = {}) => { await _adaptPackageJson({ aModuleMapping, oConfig }); }

};
