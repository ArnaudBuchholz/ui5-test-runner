import { access, stat, constants, readFile, mkdir } from 'node:fs/promises';
import { createWriteStream, writeFileSync } from 'node:fs';
import { join, isAbsolute, dirname, extname } from 'node:path';
import { BroadcastChannel, Worker, isMainThread, threadId } from 'node:worker_threads';
import zlib from 'node:zlib';
import type { ChildProcess } from 'node:child_process';
import { spawn, exec } from 'node:child_process';
import { machine, cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { ANSI_BLUE, ANSI_RED, ANSI_WHITE } from './terminal/ansi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __developmentMode = __filename.endsWith('.ts');

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

  private _childProcess: ChildProcess;

  constructor(childProcess: ChildProcess) {
    this._childProcess = childProcess;
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
  static get sourcesRoot() {
    return __dirname;
  }

  static readonly isTextTerminal = process.stdout.isTTY;
  static writeOnTerminal(text: string) {
    process.stdout.write(text);
  }

  static readonly nodeVersion = process.version;
  static readonly machine = machine;
  static readonly cpus = cpus;
  static readonly pid = process.pid;
  static readonly cwd = process.cwd.bind(process);
  static readonly threadCpuUsage = process.threadCpuUsage.bind(process);
  static readonly memoryUsage = process.memoryUsage.bind(process);

  static readonly fsConstants = constants;
  static readonly stat = stat;
  static readonly access = access;
  static readonly createWriteStream = createWriteStream;
  static readonly readFile = readFile;
  static readonly writeFileSync = writeFileSync;
  static readonly mkdir = mkdir;

  static readonly isAbsolute = isAbsolute;
  static readonly join = (...arguments_: string[]) => join(...arguments_).replaceAll('\\', '/');

  static readonly threadId = threadId;
  static readonly isMainThread = isMainThread;
  static readonly createBroadcastChannel: (name: 'logger') => BroadcastChannel = (name) => new BroadcastChannel(name);
  static readonly createWorker: (name: string, data?: unknown) => Worker = (name, data) => {
    const extension = extname(import.meta.url);
    const bootstrapPath = join(__dirname, 'workerBootstrap' + extension);
    const workerPath = './' + name + extension;
    const js2tsUrl = new URL('../js2ts.mjs', import.meta.url).toString();
    const execArgv = extension === '.ts' ? ['--no-warnings', '--import', js2tsUrl] : [];
    const worker = new Worker(bootstrapPath, {
      execArgv,
      workerData: {
        path: workerPath,
        data
      }
    });
    if (__developmentMode) {
      worker.on('online', () => console.log(`${ANSI_BLUE}[~]${ANSI_WHITE} Worker ${name} online`));
      worker.on('exit', () => console.log(`${ANSI_BLUE}[~]${ANSI_WHITE} Worker ${name} offline`));
    }
    return worker;
  };

  static readonly spawn: (command: string, arguments_: string[]) => Process = (command, arguments_) => {
    return new Process(spawn(command, arguments_));
  };
  static readonly exec: (command: 'npm', arguments_: string[]) => Process = (command, arguments_) => {
    // eslint-disable-next-line sonarjs/os-command, security/detect-child-process -- list of commands is restricted
    return new Process(exec(`${command} ${arguments_.join(' ')}`));
  };

  static readonly createGzip = zlib.createGzip.bind(zlib);
  static readonly Z_FULL_FLUSH = zlib.constants.Z_FULL_FLUSH;

  static readonly SIGINT_ANY = 0;
  static readonly SIGINT_LOGGER = 999;

  static registerSigIntHandler(callback: () => void | Promise<void>, type = this.SIGINT_ANY) {
    if (type === Platform.SIGINT_LOGGER) {
      _sigIntLoggerHandler = callback;
    } else {
      _sigIntHandlers.push(callback);
    }
  }
}

const _sigIntHandlers: (() => void | Promise<void>)[] = [];
let _sigIntLoggerHandler: () => void | Promise<void> | undefined;

if (isMainThread) {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Promise not expected but used to wait before exiting
  process.on('SIGINT', async () => {
    if (__developmentMode) {
      console.log(`${ANSI_BLUE}[~]${ANSI_WHITE} ${ANSI_RED}SIGINT${ANSI_WHITE} received`);
    }
    for (const handler of _sigIntHandlers) {
      await handler();
    }
    if (_sigIntLoggerHandler) {
      await _sigIntLoggerHandler();
    }
    process.exit(process.exitCode);
  });
}
