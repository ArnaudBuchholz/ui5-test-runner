#!/usr/bin/env node

"use strict";

const downloadPOMDependency = require("./src/maven/downloadPOMDependency");
const downloadUI5 = require("./src/maven/downloadSAPUI5sdk");
const adaptPackageJson = require("./src/maven/adaptPackageJSON");
const helper = require("./src/maven/util/helper");

async function main() {


  let oConfig = await helper.readCLIArgs();
  const aModuleMapping = await downloadPOMDependency.downloadPOMDependency(oConfig);
  oConfig = await downloadUI5.downloadUI5(oConfig);
  await adaptPackageJson.adaptPackageJson({ aModuleMapping, oConfig });
}


main()
  .catch(err => {
    console.error(err);
    process.exit(-1);
  });
