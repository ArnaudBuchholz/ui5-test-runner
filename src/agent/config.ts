import type { Configuration } from './Configuration.js';
import { UI5_TEST_RUNNER } from './contants.js';

export const getConfig = (): Configuration => window[UI5_TEST_RUNNER].config;
