"use strict";
const helper = require("./util/helper");
const c = require("./util/constant");

const fs = require("fs");
const request = require("superagent");

async function _downloadUI5(oConfig) {
    return new Promise(async (resolve, reject) => {
        let majorVersion,
            patchVersion;


        if (oConfig.ui5Version && oConfig.ui5Version.length > 0) {
            console.log(`${helper.incrementLogIndex()}.Fetching available versions of SAP UI5 `);
            let availableUI5VersionResponse = await request
                .get(c.UI5_PUBLIC_URL);
            let aAvailableUI5Version = [];
            availableUI5VersionResponse.body.routes.forEach(element => {
                aAvailableUI5Version.push(element.target.version);
            });

            // Split the base version into components
            const [baseMajor, baseMinor, basePatch] = oConfig.ui5Version.split('.').map(Number);

            const filteredVersions = aAvailableUI5Version.filter(version => {
                const [major, minor, patch] = version.split('.').map(Number);
                // Filter versions with the same major and minor version and patch version >= basePatch
                return major === baseMajor && minor === baseMinor && patch >= basePatch;
            });

            majorVersion = filteredVersions.reduce((max, current) => {
                const currentPatch = parseInt(current.split('.').slice(-1), 10);
                const maxPatch = parseInt(max.split('.').slice(-1), 10);
                return currentPatch > maxPatch ? current : max;
            }, oConfig.ui5Version);

            patchVersion = majorVersion;
            if (majorVersion === undefined) {
                console.log(`└──  NOT FOUND: Any reference to: ${oConfig.ui5Version}`);
            }
        }
        if (majorVersion === undefined) {
            console.log(`${helper.incrementLogIndex()}. Calculating latest version of SAP UI5 `);
            let latestUI5VersionJson = await request
                .get(c.UI5_PUBLIC_URL);

            majorVersion = latestUI5VersionJson.body.version;

          /*   try {
                // read the maven metadata
                console.log(`${helper.incrementLogIndex()}. Fetching maven-metadata for UI5 version : ${majorVersion}`);
                let metadataXMLResponse = await request
                //https://tools.hana.ondemand.com/additional/sapui5-rt-1.139.0.zip
                    .get(`https://tools.hana.ondemand.com/additional/sapui5-rt-${majorVersion}/zip`);
                let metadataXMLString = JSON.parse(JSON.stringify(metadataXMLResponse.body.toString("utf-8")));
                let metadataJSON = await helper.parseString(metadataXMLString);
                // extract the patch version from the metadata
                let snapshotVersions = metadataJSON.metadata.versioning[0].snapshotVersions[0].snapshotVersion;
                for (let index = 0; index < snapshotVersions.length; index++) {
                    const el = snapshotVersions[index];
                    if (el?.extension
                        && el?.extension[0] === "zip"
                        && el?.classifier
                        && el?.classifier[0] === "static") {
                        patchVersion = majorVersion;
                        break;
                    }
                }
            } catch (e) {
                // read the maven metadata
                console.log(`└──  NOT FOUND: maven-metadata for UI5 version : ${majorVersion}`);
                majorVersion = `${oConfig.ui5Version}`;
                patchVersion = majorVersion;
            } */
        }

        patchVersion = majorVersion;
        const zipFile = `${patchVersion}.zip`,
            zipSource = `https://tools.hana.ondemand.com/additional/sapui5-rt-${majorVersion}.zip`,
            outputDir = `./${c.DEST_PATH}/${patchVersion}`;
        oConfig.ui5Version = patchVersion;

        if (fs.existsSync(outputDir)) {
            // It exists
            console.log("└── File exists:", zipFile);

        } else {
            // It doesn't exist
            await helper.downloadFile(zipSource, zipFile, outputDir);
            await helper.cleanUp(zipFile);
        }

        resolve(oConfig);

    });
}


module.exports = {
    downloadUI5: async (oConfig) => { return await _downloadUI5(oConfig); }

};
