import { describe } from 'vitest';
import { testIBrowser } from './browser.test.js';

describe('generic', () => testIBrowser('puppeteer'));
