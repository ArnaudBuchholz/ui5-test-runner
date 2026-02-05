import { extname } from 'node:path';
import { Path } from './Path.js';
import { BroadcastChannel, Worker, isMainThread, threadId } from 'node:worker_threads';
import { __sourcesRoot } from './constants.js';

export class Thread {
  static readonly threadCpuUsage = process.threadCpuUsage.bind(process);
  static readonly createBroadcastChannel = (name: string) => new BroadcastChannel(name);
  /**
   * @param name relative to src/
   * @param data parameters of the worker
   * @returns Worker
   */
  static readonly createWorker: (name: string, data?: unknown) => Worker = (name, data) => {
    const extension = extname(import.meta.url);
    const workerPath = '../' + name + extension; // Must be relative to workerBootstrap
    if (process.env['NO_WORKERS']) {
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
    return worker;
  };
  static readonly isMainThread = isMainThread;
  static readonly threadId = threadId;
}
