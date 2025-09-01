"use strict";

const helper = require("./util/helper");
const c = require("./util/constant");
const fs = require("fs");
const request = require("superagent");

async function _downloadPOMDependency(oConfig) {
    //read the project's POM file
    let oProjectDependencies = await _readPOMDependency();
    let aModuleMapping = [];

    for (let dependencyIndex = 0; dependencyIndex < oProjectDependencies.length; dependencyIndex++) {
        //Lets work on one dependency at a time
        const oProjectDependency = oProjectDependencies[dependencyIndex];

        let artifact = await _extractArtifact(oProjectDependency);
        console.log(`${helper.incrementLogIndex()}. Working on dependency : ${artifact.artifactId}`);
        const outputDir = `./${c.DEST_PATH}/${artifact.artifactId}`; // name of the folder where the zip file be extracted

        // its possible that from the POm file we might find multiple version for a particular dependency
        // next set of code will read the corresponding maven metadata and keep the recent most version
        let versionMajor = await _findLatestPatchVersion(artifact, oConfig.mavenURL);

        for (let versionMajorIndex = 0; versionMajorIndex < versionMajor.length; versionMajorIndex++) {
            const patchVersion = versionMajor[versionMajorIndex].patchVersion;
            const href = versionMajor[versionMajorIndex].href;
            try {
                if (href) {
                    // generate the url for the zip file with recent version
                    const zipFile = `${artifact.artifactId}-${patchVersion}-sources.zip`;
                    const zipSource = `${href}/${zipFile}`;
                    await helper.downloadFile(zipSource, zipFile, outputDir);
                    await helper.cleanUp(zipFile);
                    aModuleMapping.push({ lib: artifact.artifactId.replace(/\./g, "/"), path: outputDir });
                    break;
                }
            } catch (e) {

            }
        }
    }

    return aModuleMapping;
}


async function _extractArtifact(oProjectDependency) {
    let artifact = {
        groupId: oProjectDependency.dependency[0].groupId[0].replace(/\./g, "/"),
        artifactId: oProjectDependency.dependency[0].artifactId[0],
        version: oProjectDependency.dependency[0].version[0]
    };
    return artifact;
}






async function _readPOMDependency() {
    console.log(`${helper.incrementLogIndex()}. Reading project's POM file`);
    console.log(`${helper.incrementLogIndex()}. Extracting dependencies defined in POM`);
    const pomXML = await fs.promises.readFile("./pom.xml");
    const pomJSON = await helper.parseString(pomXML);
    // Extract the projects artifacts from the pom file
    console.log(`└── Found ${pomJSON.project.dependencies.length}`);
    return pomJSON.project.dependencies;
}


async function _findLatestPatchVersion(artifact, url) {
    let versionMajor = [];

    let metadataXMLResponse = await request
        .get(`${url}${artifact.groupId}/${artifact.artifactId}/maven-metadata.xml`);
    let metadataXMLString = JSON.parse(JSON.stringify(metadataXMLResponse.body.toString("utf-8")));
    let metadataJSON = await helper.parseString(metadataXMLString);
    const aVersionComplete = metadataJSON.metadata.versioning[0].versions[0].version;

    let aLimitedVersion = aVersionComplete
        .sort(helper.compareVersions)
        .filter(helper.buildVersionFilter(artifact.version)).reverse();
    for (let versionIndex = 0; versionIndex < aLimitedVersion.length; versionIndex++) {
        const availableVersion = aLimitedVersion[versionIndex];
        let oVersion = {};
        oVersion.version = availableVersion;

        oVersion.href = `${url}${artifact.groupId}/${artifact.artifactId}/${oVersion.version}`;
        if (availableVersion.includes("-SNAPSHOT")) {
            let metadataSource = `${oVersion.href}/maven-metadata.xml`;
            try {
                // read the maven metadata
                console.log(`${helper.incrementLogIndex()}. Fetching maven-metadata for : ${artifact.artifactId}-${oVersion.version}`);

                let metadataXMLResponse = await request
                    .get(metadataSource);
                let metadataXMLString = JSON.parse(JSON.stringify(metadataXMLResponse.body.toString("utf-8")));
                let metadataJSON = await helper.parseString(metadataXMLString);
                // extract the patch version from the metadata
                let timestamp = metadataJSON.metadata.versioning[0].snapshot[0].timestamp[0];
                let buildNumber = metadataJSON.metadata.versioning[0].snapshot[0].buildNumber[0];
                oVersion.patchVersion = `${oVersion.version.split("-")[0]}-${timestamp}-${buildNumber}`;
                const aSnapshotVersion = metadataJSON.metadata.versioning[0].snapshotVersions[0].snapshotVersion;
                for (let index = 0; index < aSnapshotVersion.length; index++) {
                    const snapshotVersion = aSnapshotVersion[index];
                    if (snapshotVersion.extension[0] === "zip") {
                        versionMajor.push(oVersion);
                        break;
                    }

                }
            } catch (e) { /* empty */ }
        }
        else {
            oVersion.patchVersion = availableVersion;
            versionMajor.push(oVersion);
        }
    }
    return versionMajor;
}




module.exports = {
    downloadPOMDependency: async (oConfig) => { return await _downloadPOMDependency(oConfig); }
   
};
