const admZip = require("adm-zip");
const path = require('path');

const zipFile = path.resolve(process.argv[2]); // get the path from command line arguments
const outputDir = path.resolve(process.argv[3]);  // get the output path from command line arguments

var zip = new admZip(`${zipFile}`);

zip.extractAllTo(outputDir, true);
process.send(`Package ${outputDir} is now available`);
process.exit();