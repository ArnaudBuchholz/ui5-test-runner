const { readFileSync } = require('fs');
const { join } = require('path');

const [,,port] = process.argv;
const urls = readFileSync(join(__dirname, 'openui5.urls'), 'utf8').split('\n').filter(Boolean);

const main = async () => {
  let errors = 0;

  for (const url of urls) {
    const response = await fetch(`http://localhost:${port}/${url}`);
    if (response.status !== 200) {
      ++errors;
      console.log(`❌ ${url}`);
    }
  }

  if (errors) {
    process.exitCode = -1;
  } else {
    console.log('✅ All URLs work');
  }
}

main();
