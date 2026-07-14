import { logger, Http, Process } from '../../platform/index.js';
import type { IProcess } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { Command } from '../../Command.js';

const POLL_INTERVAL = 250;

export const start = async (configuration: Configuration): Promise<IProcess | undefined> => {
  if (!configuration.start) {
    return undefined;
  }
  logger.info({ source: 'job', message: 'Executing start command...' });
  logger.info({
    source: 'progress',
    message: 'Executing start command',
    pageId: undefined,
    data: { value: 0, max: 0 }
  });
  const [command, arguments_] = await Command.parse(configuration, configuration.start);
  const startProcess = Process.spawn(command, arguments_, {
    cwd: configuration.cwd,
    windowsHide: true,
    detached: true
  });
  const { startWaitUrl: url, startWaitMethod: method, startTimeout: timeout } = configuration;
  if (url) {
    logger.info({ source: 'job', message: 'Waiting for start URL to be reachable', data: { url } });
    logger.info({
      source: 'progress',
      message: 'Waiting for start URL to be reachable',
      pageId: undefined,
      data: { value: 0, max: 0 }
    });
    // No need for Exit.registerAsyncTask as Process already uses one
    const controller = new AbortController();
    let isTimedOut = false;
    const timeoutHandle = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, timeout);
    using _ = {
      [Symbol.dispose]: () => {
        clearTimeout(timeoutHandle);
      }
    };
    while (!isTimedOut && startProcess.code === undefined) {
      try {
        const fetchResult = await Http.fetch(url, { method, signal: controller.signal });
        if (fetchResult.ok) {
          return startProcess;
        }
      } catch {
        // errors are already logged by Http.fetch
      }
      if (!isTimedOut && startProcess.code === undefined) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    }
    if (startProcess.code === undefined) {
      await startProcess.kill();
      throw new Error(`Timeout while waiting for ${url}`);
    }
    throw new Error(`Start command failed with exit code ${startProcess.code}`);
  }
  return startProcess;
};
