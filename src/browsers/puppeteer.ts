import type { IBrowser } from './IBrowser.js';
import type { launch as launchFunction } from 'puppeteer';
import { Npm } from '../Npm.js';

export const factory = async (): Promise<IBrowser> => {
  const { launch } = (await Npm.import('puppeteer')) as { launch: typeof launchFunction };

  return {
    setup() {
      throw new Error('nope');
    },
    newWindow() {
      throw new Error('nope');
    }
  };
};
