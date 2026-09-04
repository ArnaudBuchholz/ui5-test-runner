import { describe } from 'vitest';
import { testBrowser } from './browser.test.js';

describe('generic', () => testBrowser({
  name: 'puppeteer',
}));
