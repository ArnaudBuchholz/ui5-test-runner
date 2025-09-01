"use strict";

const c = require("./constant");

const xml2jsParseString = require("xml2js").parseString;
const fs = require("fs");
const request = require("superagent");
const yargs = require("yargs");
const { fork } = require("child_process");
const path = require('path');

let logIndex = 0;
const PROGRESS = ["\\", "|", "/", "-"];
let progressIndex = 0;
let progressCount = 1;
const _wrap = pattern => {
    if (!/[()[\]{},]/g.test(pattern)) {
        pattern = `[${pattern},)`;
    }

    return pattern;
};
const _splitVersionPattern = pattern => {
    const regex = /[\[\(\{].*?[\]\)\}]/g;
    return pattern.match(regex);
};

const _splitVersion = version => {
    let [,
        major,
        minor,
        patch,
        snapshot
    ] = version.match(/(\d+)\.(\d+)(?:\.(\d+)(-SNAPSHOT)?)?/i);
    return [Number(major), Number(minor), Number(patch || "0"), snapshot ? 1 : 0];
};


const _compareVersions = (version1, version2) => {
    const [major1, minor1, patch1, snapshot1] = _splitVersion(version1);
    const [major2, minor2, patch2, snapshot2] = _splitVersion(version2);
    if (major1 !== major2) {
        return major1 - major2;
    }
    if (minor1 !== minor2) {
        return minor1 - minor2;
    }
    if (patch1 !== patch2) {
        return patch1 - patch2;
    }
    return snapshot1 - snapshot2;
};

const _isVersionLower = (version1, version2) => _compareVersions(version1, version2) < 0;
const _isVersionsLowerOrEqual = (version1, version2) => _compareVersions(version1, version2) <= 0;


const _buildVersionFilter = constraint => {

    let pattern = _wrap(constraint);
    let patterns = _splitVersionPattern(pattern);

    let checkMin = (version, minIncluded, minVersion) => {
        if (!minVersion) {
            return true;
        }
        if (minIncluded === "[") {
            return _isVersionsLowerOrEqual(minVersion, version);
        } else {
            return _isVersionLower(minVersion, version);
        }
    };

    let checkMax = (version, maxIncluded, maxVersion) => {
        if (!maxVersion) {
            return true;
        }
        if (maxIncluded === "]") {
            return _isVersionsLowerOrEqual(version, maxVersion);
        } else {
            return _isVersionLower(version, maxVersion);
        }
    };
    return function isInRange(version) {
        //  console.log(patterns)
        let bIsValid = true;
        patterns.every(pattern => {
            const [,
                minIncluded,
                minVersion,
                maxVersion = "",
                maxIncluded
            ] = pattern.match(/(\[|\()([^,]*),([^\])]*)(\]|\))/);
            bIsValid = bIsValid && (minVersion ? checkMin(version, minIncluded, minVersion) : true) &&
                (maxVersion ? checkMax(version, maxIncluded, maxVersion) : true);
        });

        return bIsValid;
    };

};

async function _cleanUp(zipFile) {
    try {
        console.log(`${_incrementLogIndex()}. Clean Up : ${zipFile}`);
        await fs.promises.unlink(zipFile);
        console.log("└── File removed:", zipFile);
    } catch (error) {
        console.error("└── There was an error removing the file", error);
    }
}

// Function to wrap fork in a Promise
const _executeUnzipProcess = (fileName, args) => {
    return new Promise((resolve, reject) => {
        const childProc = fork(fileName, args);

        childProc.on("message", (message) => {
            resolve(message);
        });

        childProc.on("error", (error) => {
            reject(error);
        });
    });
};

function _millisToMinutesAndSeconds(millis) {
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
// Function to start interval
const _startInterval = (interval) => {
    progressCount = 0;
    progressIndex = 0;
    return setInterval(() => {
        let timePassed = _millisToMinutesAndSeconds(interval * progressCount++);
        process.stdout.write(`\r   ⏳ ${timePassed}  ${PROGRESS[progressIndex++]}`);
        progressIndex %= PROGRESS.length;
    }, interval);
};


// fn to download and unzip the zip file 
async function _downloadFile(zipSource, zipFile, outputDir) {

    return new Promise(async (resolve, reject) => {
        console.log(`${_incrementLogIndex()}. Downloading ${zipSource}`);
        let timer = _startInterval(250);
        await request
            .get(zipSource)
            .on("error", reject)
            .pipe(fs.createWriteStream(zipFile))
            .on("finish", async function () {
                clearInterval(timer);
                console.log("\n" + `${_incrementLogIndex()}. Finished downloading : ${zipFile}`);
                console.log(`${_incrementLogIndex()}. Unzipping to directory : ${outputDir}`);
                let timerUnzip = _startInterval(250);
                try {
                    let message = await _executeUnzipProcess(path.join(__dirname, 'unzip.js'), [zipFile, outputDir]);
                    console.log("\n" + `${_incrementLogIndex()}. ${message}`);
                }
                catch (error) {
                    console.error("Error during zip extraction", error);
                }
                finally {
                    clearInterval(timerUnzip);
                }
                resolve();
            });

    });
}

function _incrementLogIndex() {
    logIndex = logIndex + 1;
    return logIndex;
}

async function _readCLIArgs() {
    let oCLIArgs = yargs.argv;

    let oConfig = {
        ui5Version: oCLIArgs?.ui5Version,
        mavenURL: oCLIArgs?.mavenURL,
        useUI5TestRunnerServer: (/true/).test(oCLIArgs?.useUI5TestRunnerServer) || false
    };
    return oConfig;
}

async function _parseString(xml) {
    return new Promise((resolve, reject) => {
        xml2jsParseString(xml, { mergeAttrs: true }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

module.exports = {
    buildVersionFilter: (constraint) => { return _buildVersionFilter(constraint); },
    cleanUp: async (zipFile) => { await _cleanUp(zipFile); },
    downloadFile: async (zipSource, zipFile, outputDir) => { await _downloadFile(zipSource, zipFile, outputDir); },
    incrementLogIndex: () => { return _incrementLogIndex(); },
    readCLIArgs: async () => { return await _readCLIArgs(); },
    parseString: async (xml) => { return await _parseString(xml); },
    compareVersions: (version1, version2) => { return _compareVersions(version1, version2); }
};
