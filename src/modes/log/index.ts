import { __developmentMode, Exit } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { LogReader } from './LogReader.js';
import { serve } from 'reserve';
import { LogStorage } from './LogStorage.js';
import { buildREserveConfiguration } from './REserve.js';
import { BrowserFactory } from '../../browsers/factory.js';
import type { InternalLogAttributes } from '../../platform/logger/types.js';
import type { LogMetrics } from './LogMetrics.js';

export const log = async (configuration: Configuration) => {
  const logFileName = configuration.log!; // Validated by configuration
  let stopped = false;
  const metrics = {
    inputSize: 0,
    outputSize: 0,
    chunksCount: 0
  } satisfies LogMetrics;
  const storage = LogStorage.create();
  const { promise, resolve } = Promise.withResolvers<void>();
  const server = serve(buildREserveConfiguration(storage, metrics));
  Exit.registerAsyncTask({
    name: 'log',
    stop: async () => {
      stopped = true;
      await server?.close();
      resolve();
    }
  });
  const browser = await BrowserFactory.build('puppeteer');
  const browserReady = browser.setup({
    visible: true
  });
  server.on('ready', ({ url, port }) => {
    console.log(url);
    void browserReady
      .then(() =>
        browser.newWindow({
          url: `http://localhost:${port}/query`,
          scripts: []
        })
      )
      .then(() => {
        console.log('Use CTRL+C to exit');
      });
  });
  for await (const item of LogReader.read(logFileName)) {
    if (stopped) {
      break;
    }
    const { type, ...attributes } = item;
    if (type === 'log') {
      storage.add(attributes as InternalLogAttributes);
    } else if (__developmentMode) {
      Object.assign(metrics, attributes);
    }
  }
  await promise;
};
