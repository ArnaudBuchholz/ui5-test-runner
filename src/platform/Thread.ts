import { extname } from 'node:path';
import { Path } from './Path.js';
import { BroadcastChannel, Worker, isMainThread, threadId } from 'node:worker_threads';
import { __sourcesRoot } from './constants.js';
import { logger } from './logger/proxy.js';

export class Thread {
  static readonly threadCpuUsage = process.threadCpuUsage.bind(process);
  static readonly createBroadcastChannel = (name: string) => new BroadcastChannel(name);
  /**
   * @param name relative to src/
   * @param data parameters of the worker
   * @returns Worker
   */
  static readonly createWorker: (name: string, data?: object) => Worker = (name, data) => {
    const extension = extname(import.meta.url);
    const workerPath = '../' + name + extension; // Must be relative to workerBootstrap
    if (process.env['NO_WORKERS']) {
      logger?.debug({ source: 'thread', message: `Creating fiber for ${name}`, data });
      void (async () => {
        const { workerMain } = (await import(workerPath)) as { workerMain: (data: unknown) => void };
        workerMain(data);
      })();
      return {
        on: (event, callback) => {
          /* v8 ignore else -- @preserve */
          if (event === 'exit') {
            callback(0);
          }
        }
      } as Worker;
    }
    logger?.debug({ source: 'thread', message: `Creating worker for ${name}`, data });
    const bootstrapPath = Path.join(__sourcesRoot, 'platform/workerBootstrap' + extension);
    const js2tsUrl = new URL('js2ts.mjs', import.meta.url).toString();
    /* v8 ignore next -- @preserve */
    const execArgv = extension === '.ts' ? ['--no-warnings', '--import', js2tsUrl] : [];
    const worker = new Worker(bootstrapPath, {
      execArgv,
      workerData: {
        path: workerPath,
        data
      }
    });
    /* v8 ignore next -- @preserve */
    worker.on('online', () =>
      logger?.debug({ source: 'thread', message: `Worker for ${name} online`, data: { threadId: worker.threadId } })
    );
    /* v8 ignore next -- @preserve */
    worker.on('exit', () =>
      logger?.debug({ source: 'thread', message: `Worker for ${name} offline`, data: { threadId: worker.threadId } })
    );
    return worker;
  };
  static readonly isMainThread = isMainThread;
  static readonly threadId = threadId;
}
