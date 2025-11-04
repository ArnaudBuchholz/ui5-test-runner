import { access, stat, constants } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { BroadcastChannel, Worker, isMainThread, threadId, workerData } from 'node:worker_threads';
import zlib from 'node:zlib';

const WORKER_FLAGS = ['--experimental-strip-types', '--disable-warning=ExperimentalWarning'];

/** This class simplifies mocking during tests */
export class Platform {
  static readonly pid = process.pid;
  static readonly cwd = process.cwd.bind(process);
  static readonly threadCpuUsage = process.threadCpuUsage.bind(process);
  static readonly memoryUsage = process.memoryUsage.bind(process);

  static readonly fsConstants = constants;
  static readonly stat = stat;
  static readonly access = access;
  static readonly createWriteStream = createWriteStream;

  static readonly isAbsolute = isAbsolute;
  static readonly join = (...arguments_: string[]) => join(...arguments_).replaceAll('\\', '/');

  static readonly threadId = threadId;
  static readonly isMainThread = isMainThread;
  static readonly createBroadcastChannel: (name: 'logger') => BroadcastChannel = (name) => new BroadcastChannel(name);
  static readonly createWorker: (name: string, data?: unknown) => Worker = (name, data) => {
    const workerPath = join(__dirname, `workers/${name}.ts`);
    const worker = new Worker(workerPath, {
      workerData: data,
      execArgv: WORKER_FLAGS
    });
    return worker;
  };
  static readonly workerData = workerData as object;

  static readonly createGzip = zlib.createGzip.bind(zlib);
  static readonly Z_FULL_FLUSH = zlib.constants.Z_FULL_FLUSH;
}
