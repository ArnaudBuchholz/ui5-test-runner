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
    this._childProcess.stdout?.on('data', (data: string) => {
      this._stdout.push(data);
    });
    this._childProcess.stderr?.on('data', (data: string) => {
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
  /** Detect if local development */
  static get isLocalDevelopment() {
    if (process.env['IS_LOCAL_DEVELOPMENT']) {
      return true;
    }
    if (isMainThread) {
      const { _preload_modules: preloadModules } = process as unknown as { _preload_modules: string[] };
      return preloadModules.some((path: string) => path.includes('tsx'));
    }
    return false;
  }

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
    let execArgv: string[] = [];
    let workerPath: string;
    let environment;
    if (Platform.isLocalDevelopment) {
      workerPath = join(__dirname, `workers/${name}.ts`);
      execArgv = ['--require', 'tsx'];
      environment = {
        IS_LOCAL_DEVELOPMENT: 'true'
      };
    } else {
      workerPath = join(__dirname, `workers/${name}.js`);
    }
    const worker = new Worker(workerPath, {
      execArgv,
      env: environment,
      workerData: data
    });
    if (Platform.isLocalDevelopment) {
      worker.on('online', () => console.log(`🧢 Worker ${name} online`));
      worker.on('exit', () => console.log(`🧢 Worker ${name} offline`));
    }
    return worker;
  };
  static readonly workerData = workerData as object;

  static readonly spawn: (command: string, arguments_: string[]) => Process = (command, arguments_) => {
    return new Process(spawn(command, arguments_));
  };
  static readonly exec: (command: 'npm', arguments_: string[]) => Process = (command, arguments_) => {
    // eslint-disable-next-line sonarjs/os-command, security/detect-child-process -- list of commands is restricted
    return new Process(exec(`${command} ${arguments_.join(' ')}`));
  };

  static readonly createGzip = zlib.createGzip.bind(zlib);
  static readonly Z_FULL_FLUSH = zlib.constants.Z_FULL_FLUSH;
}
