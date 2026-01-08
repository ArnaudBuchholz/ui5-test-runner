import { access, stat, constants, readFile, mkdir } from 'node:fs/promises';
import { createReadStream, createWriteStream, writeFileSync } from 'node:fs';
import { join, isAbsolute, dirname, extname } from 'node:path';
import { BroadcastChannel, Worker, isMainThread, threadId } from 'node:worker_threads';
import zlib from 'node:zlib';
import { machine, cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { ANSI_BLUE, ANSI_RED, ANSI_WHITE } from './terminal/ansi.js';
import { stripVTControlCharacters } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __developmentMode = __filename.endsWith('.ts');

export class Terminal {
  static readonly isTTY = process.stdout.isTTY;
  static setRawMode(callback: ((buffer: Buffer) => void) | false) {
    if (callback === false) {
      process.stdin.setRawMode(false);
    } else {
      process.stdin.setRawMode(true);
      process.stdin.on('data', callback);
    }
  }
  static write(text: string) {
    process.stdout.write(text);
  }
  static get width() {
    return process.stdout.columns;
  }
  static onResize(callback: () => void) {
    process.stdout.on('resize', callback);
  }
}

export class Platform {
  static get sourcesRoot() {
    return __dirname;
  }

  static readonly nodeVersion = process.version;
  static readonly machine = machine;
  static readonly cpus = cpus;
  static readonly pid = process.pid;
  static readonly cwd = process.cwd.bind(process);
  static readonly threadCpuUsage = process.threadCpuUsage.bind(process);
  static readonly memoryUsage = process.memoryUsage.bind(process);
  static readonly setExitCode = (code: number) => {
    process.exitCode = code;
  };

  static readonly fsConstants = constants;
  static readonly stat = stat;
  static readonly access = access;
  static readonly createReadStream = createReadStream;
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
    const workerPath = './' + name + extension;
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
    const bootstrapPath = join(__dirname, 'workerBootstrap' + extension);
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
      worker.on('online', () => console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}Worker ${name} online`));
      worker.on('exit', () => console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}Worker ${name} offline`));
    }
    return worker;
  };

  static readonly createGzip = zlib.createGzip.bind(zlib);
  static readonly createGunzip = zlib.createGunzip.bind(zlib);
  static readonly Z_FULL_FLUSH = zlib.constants.Z_FULL_FLUSH;

  static readonly stripVTControlCharacters = stripVTControlCharacters;

  static readonly SIGINT_ANY = 0;
  static readonly SIGINT_LOGGER = 999;

  static registerSigIntHandler(callback: () => void | Promise<void>, type = this.SIGINT_ANY) {
    if (type === Platform.SIGINT_LOGGER) {
      _sigIntLoggerHandler = callback;
    } else {
      _sigIntHandlers.push(callback);
    }
  }

  static readonly onSigInt = async () => {
    if (__developmentMode) {
      console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}${ANSI_RED}SIGINT${ANSI_WHITE} received`);
    }
    for (const handler of _sigIntHandlers) {
      try {
        await handler();
      } catch {
        // ignore
      }
    }
    if (_sigIntLoggerHandler) {
      try {
        await _sigIntLoggerHandler();
      } catch {
        // ignore
      }
    }
    process.exit(process.exitCode);
  };
}

const _sigIntHandlers: (() => void | Promise<void>)[] = [];
let _sigIntLoggerHandler: () => void | Promise<void> | undefined;

if (isMainThread) {
  process.on('SIGINT', () => {
    void Platform.onSigInt();
  });
}
