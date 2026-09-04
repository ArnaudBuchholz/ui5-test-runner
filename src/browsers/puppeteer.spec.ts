import { describe, vi } from 'vitest';
import { testBrowser } from './browser.test.js';
import { Npm } from '../Npm.js';

const mockNpmImport = vi.spyOn(Npm, 'import');

describe('generic', () =>
  testBrowser({
    name: 'puppeteer',
    failedSetupTestCases: [
      {
        label: 'launch fails',
        setup: () => {
          mockNpmImport.mockResolvedValueOnce({
            launch() {
              throw new Error('Failed');
            }
          });
        }
      }
    ]
  }));
