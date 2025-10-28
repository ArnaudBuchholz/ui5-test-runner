import { access, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { BroadcastChannel, Worker, isMainThread, threadId } from 'node:worker_threads';
import zlib from 'node:zlib';

const WORKER_FLAGS = ['--experimental-strip-types', '--disable-warning=ExperimentalWarning'];

/** This class simplifies mocking during tests */
export class Platform {
  static readonly pid = process.pid;
  static readonly cwd = process.cwd;
  static readonly threadCpuUsage = process.threadCpuUsage;
  static readonly memoryUsage = process.memoryUsage;

  static readonly stat = stat;
  static readonly access = access;
  static readonly createWriteStream = createWriteStream;

  static readonly join = join;

  static readonly threadId = threadId;
  static readonly isMainThread = isMainThread;
  static createBroadcastChannel(name: 'logger') {
    return new BroadcastChannel(name);
  }
  static createWorker(name: string, data?: unknown) {
    const workerPath = join(__dirname, `workers/${name}.ts`);
    const worker = new Worker(workerPath, {
      workerData: data,
      execArgv: WORKER_FLAGS
    });
    return worker;
  }

  static readonly createGzip = zlib.createGzip;
  static readonly Z_FULL_FLUSH = zlib.constants.Z_FULL_FLUSH;
}
