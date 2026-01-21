import { join, extname } from 'node:path';
import { BroadcastChannel, Worker, isMainThread, threadId } from 'node:worker_threads';
import { ANSI_BLUE, ANSI_WHITE } from '../terminal/ansi.js';
import { __developmentMode, __sourcesRoot } from './constants.js';

export class Thread {
  static readonly threadCpuUsage = process.threadCpuUsage.bind(process);
  static readonly createBroadcastChannel: (name: 'logger') => BroadcastChannel = (name) => new BroadcastChannel(name);
  /**
   *
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
        if (__developmentMode) {
          console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}Fiber ${name} online`);
        }
      })();
      return {
        on: (event, callback) => {
          if (event === 'exit') {
            if (__developmentMode) {
              console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}Fiber ${name} offline`);
            }
            callback(0);
          }
        }
      } as Worker;
    }
    const bootstrapPath = join(__sourcesRoot, 'platform/workerBootstrap' + extension);
    const js2tsUrl = new URL('js2ts.mjs', import.meta.url).toString();
    const execArgv = extension === '.ts' ? ['--no-warnings', '--import', js2tsUrl] : [];
    const worker = new Worker(bootstrapPath, {
      execArgv,
      workerData: {
        path: workerPath,
        data
      }
    });
    if (__developmentMode) {
      worker.on('online', () => console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}Worker ${name} online`));
      worker.on('exit', () => console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}Worker ${name} offline`));
    }
    return worker;
  };
  static readonly isMainThread = isMainThread;
  static readonly threadId = threadId;
}
