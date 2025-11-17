import { BrowserFactory } from './browsers/factory.js';
import type { Configuration } from './configuration/Configuration.js';
import { Modes } from './configuration/Modes.js';
import { logger } from './logger.js';
import { Platform } from './Platform.js';

export const execute = async (configuration: Configuration) => {
  if (configuration.mode === Modes.version) {
    const packageFile = await Platform.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageFile);
    console.log(packageJson.version);
  } else if (configuration.mode === Modes.help) {
    console.log('Please check https://arnaudbuchholz.github.io/ui5-test-runner/');
  } else {
    logger.start(configuration);
    // Simple test
    const browser = await BrowserFactory.build('puppeteer');
    await browser.setup({});
    const urls = [
      'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/testsuite.qunit.html',
      'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/Test.qunit.html?testsuite=test-resources/sap/ui/demo/cart/testsuite.qunit&test=unit/unitTests',
      'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/Test.qunit.html?testsuite=test-resources%2Fsap%2Fui%2Fdemo%2Fcart%2Ftestsuite.qunit&test=integration%2FopaTestsComponent#/categories',
      'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/Test.qunit.html?testsuite=test-resources/sap/ui/demo/cart/testsuite.qunit&test=integration/opaTestsIFrame'
    ];
    const pages = [];
    for (const url of urls) {
      const page = await browser.newWindow({
        scripts: [],
        url
      });
      pages.push(page);
    }
    const done = false;
    while (!done) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      for (const [index, url_] of urls.entries()) {
        const page = pages[index]!;
        const url = url_.split('/test/')[1];
        try {
          // Value must be serializable...
          const value = await page.eval('QUnit.config.modules');
          console.log(url, value ? 'OK' : 'KO');
        } catch {
          console.log(url, 'error');
        }
      }
    }
    for (const page of pages) {
      await page.close();
    }
    await browser.shutdown();
    await logger.stop();
    console.log('🧢 done.');
  }
};
