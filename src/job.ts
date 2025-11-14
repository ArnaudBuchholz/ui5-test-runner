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
    const page = await browser.newWindow({
      scripts: [],
      url: 'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/test/testsuite.qunit.html'
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await page.close();
    await browser.shutdown();
    await logger.stop();
    console.log('🧢 done.');
  }
};
