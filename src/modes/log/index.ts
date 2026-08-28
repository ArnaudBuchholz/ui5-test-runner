import { __developmentMode, Exit } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { LogReader } from './LogReader.js';
import { serve } from 'reserve';
import { LogStorage } from './LogStorage.js';
import { buildREserveConfiguration } from './reserve.js';
import { BrowserFactory } from '../../browsers/factory.js';
import type { InternalLogAttributes } from '../../platform/logger/types.js';
import { getInitialLogMetrics } from './LogMetrics.js';

const dumpLogToStdout = async (configuration: Configuration) => {
  const logFileName = configuration.log!; // Validated by configuration
  const logFilter = configuration.logFilter;
  const filterExpression =
    logFilter && logFilter.trim() !== '' ? LogStorage.buildFilterExpression(logFilter) : undefined;

  process.stdout.write('[\n');
  let isFirst = true;
  for await (const { type, ...attributes } of LogReader.read(logFileName)) {
    if (type !== 'log') {
      continue;
    }
    const logAttributes = attributes as Readonly<InternalLogAttributes>;
    if (filterExpression && !filterExpression(logAttributes)) {
      continue;
    }
    if (!isFirst) {
      process.stdout.write(',\n');
    }
    process.stdout.write('  ' + JSON.stringify(attributes));
    isFirst = false;
  }
  process.stdout.write(isFirst ? ']\n' : '\n]\n');
};

export const log = async (configuration: Configuration) => {
  if (configuration.logDump) {
    await dumpLogToStdout(configuration);
    return;
  }

  const logFileName = configuration.log!; // Validated by configuration
  let isStopped = false;
  const metrics = getInitialLogMetrics();
  const storage = LogStorage.create();

  const { promise, resolve } = Promise.withResolvers<void>();
  const abortController = new AbortController();
  const abortSignal = abortController.signal;
  const server = serve(
    buildREserveConfiguration({
      configuration,
      storage,
      metrics,
      abortController
    })
  );
  const stop = async () => {
    isStopped = true;
    await server?.close();
    resolve();
  };
  abortSignal.addEventListener('abort', () => {
    void stop();
  });
  Exit.registerAsyncTask({
    name: 'log',
    stop: stop
  });
  const browser = await BrowserFactory.build(configuration, 'puppeteer');
  const browserReady = browser.setup({
    visible: true
  });
  server.on('ready', ({ url, port }) => {
    console.log(url);
    void browserReady
      .then(() =>
        browser.newWindow({
          pageId: 0,
          url: `http://localhost:${port}/`,
          scripts: []
        })
      )
      .then(() => {
        console.log('Use CTRL+C to exit');
      });
  });
  // TODO: pass the abort signal here
  for await (const item of LogReader.read(logFileName, abortSignal)) {
    if (isStopped) {
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
