import { access, stat, constants, readFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { BroadcastChannel, Worker, isMainThread, threadId, workerData } from 'node:worker_threads';
import zlib from 'node:zlib';
import type { ChildProcess } from 'node:child_process';
import { spawn, exec } from 'node:child_process';

class Process {
  private _stdout: string[] = [];
  get stdout() {
    return this._stdout.join('');
  }

  private _stderr: string[] = [];
  get stderr() {
    return this._stderr.join('');
  }

  private _code: number | undefined;
  get code() {
    return this._code;
  }

  private _closed: Promise<void>;
  get closed() {
    return this._closed;
  }

  constructor(private _childProcess: ChildProcess) {
    const { promise, resolve } = Promise.withResolvers<void>();
    this._closed = promise;
    this._childProcess.stdout?.on('data', (data) => {
      this._stdout.push(data);
    });
    this._childProcess.stderr?.on('data', (data) => {
      this._stderr.push(data);
    });
    this._childProcess.on('close', (code) => {
      this._code = code ?? 0;
      resolve();
    });
  }

  abort() {}
}

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
  static readonly readFile = readFile;

  static readonly isAbsolute = isAbsolute;
  static readonly join = (...arguments_: string[]) => join(...arguments_).replaceAll('\\', '/');

  static readonly threadId = threadId;
  static readonly isMainThread = isMainThread;
  static readonly createBroadcastChannel: (name: 'logger') => BroadcastChannel = (name) => new BroadcastChannel(name);
  static readonly createWorker: (name: string, data?: unknown) => Worker = (name, data) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { _preload_modules: preloadModules } = process as any;
    let execArgv: string[] = [];
    let workerPath: string;
    const tsx = preloadModules.find((path: string) => path.includes('tsx'));
    if (tsx) {
      workerPath = join(__dirname, `workers/${name}.ts`);
      execArgv = ['--require', 'tsx']
    } else {
      workerPath = join(__dirname, `workers/${name}.js`);
    }
    const worker = new Worker(workerPath, {
      execArgv,
      workerData: data,
    });
    return worker;
  };
  static readonly workerData = workerData as object;

  static readonly spawn: (command: string, arguments_: string[]) => Process = (command, arguments_) => {
    try {
      return new Process(spawn(command, arguments_));
    } catch (error) {
      throw error;
    }
  };
  static readonly exec: (command: string, arguments_: string[]) => Process = (command, arguments_) => {
    try {
      return new Process(exec(`${command} ${arguments_.join(' ')}`));
    } catch (error) {
      throw error;
    }
  };

  static readonly createGzip = zlib.createGzip.bind(zlib);
  static readonly Z_FULL_FLUSH = zlib.constants.Z_FULL_FLUSH;
}
