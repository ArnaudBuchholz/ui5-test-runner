import { Configuration } from './configuration/Configuration.js';
import { Modes } from './configuration/Modes.js';
import { Platform } from './Platform.js';

export const execute = async (configuration: Configuration) => {
  if (configuration.mode === Modes.version) {
    const packageFile = await Platform.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageFile);
    console.log(packageJson.version);
  } else if (configuration.mode === Modes.help) {
    console.log('Please check https://arnaudbuchholz.github.io/ui5-test-runner/');
  } else {
    // not implemented yet
  }
};
