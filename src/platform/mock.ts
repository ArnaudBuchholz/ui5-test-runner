import { vi } from 'vitest';
import type { ReadStream, WriteStream } from 'node:fs';
import type { BroadcastChannel, Worker } from 'node:worker_threads';
import { basename, extname, join, relative } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import type { ILoggerService } from './logger/ILogger.js';
import type { LogAttributes } from './logger/types.js';
import type { IAsyncTask, ExitShutdownError as ExitShutdownErrorType } from './Exit.js';
import type { Terminal } from './Terminal.js';
import { options, defaults } from '../configuration/options.js';
import assert from 'node:assert';

export const MOCK_CWD = '~/ui5-test-runner/vitest';
// patch options to ensure the value is propagated
assert.ok(options[0].name === 'cwd');
Object.assign(options[0], { default: MOCK_CWD });
Object.assign(defaults, { cwd: MOCK_CWD });

interface UnmockHandle {
  restore(): void;
  [Symbol.dispose](): void;
}

type Members = Record<string, unknown>;

const _registry = new WeakMap<object, { real: Members; mocked: Members }>();

const functionMembers = (object: object): Members => {
  const out: Members = {};
  for (const key of Object.getOwnPropertyNames(object)) {
    if (typeof (object as Members)[key] === 'function') {
      out[key] = (object as Members)[key];
    }
  }
  return out;
};

// Called at mock time: registers the real vs mocked function members for a given export.
// `mocked` is the vi.fn()-filled object specs import; `real` is the genuine original.
const registerUnmock = <T extends object>(mocked: T, real: T): void => {
  _registry.set(mocked, { real: functionMembers(real), mocked: functionMembers(mocked) });
};

// Swap in the real implementation for a mocked platform export.
// Returns a handle with restore() and [Symbol.dispose]() to flip back to mocked state.
// Non-transitive: only this object's own statics are affected; logger, Exit, etc. stay mocked.
export const unmock = (target: object): UnmockHandle => {
  const entry = _registry.get(target);
  assert.ok(entry, 'unmock: object was not registered as a mocked platform export');
  Object.assign(target, entry.real);
  const restore = () => {
    Object.assign(target, entry.mocked);
  };
  return { restore, [Symbol.dispose]: restore };
};

const mockMethods = (object: Record<string, unknown>, members: string[]) => {
  for (const member of members) {
    if (typeof object[member] === 'function') {
      object[member] = vi.fn();
    }
  }
};

const mockStaticMethodsOfExports = <T extends object>(actual: T): T => {
  const mocked = { ...actual };
  for (const exportName in mocked) {
    const exportValue = mocked[exportName as keyof T];
    if (typeof exportValue === 'function') {
      mockMethods(exportValue as Record<string, unknown>, Object.getOwnPropertyNames(exportValue));
      // eslint-disable-next-line sonarjs/different-types-comparison -- exportValue could be null
    } else if (typeof exportValue === 'object' && exportValue !== null) {
      mockMethods(exportValue as Record<string, unknown>, Object.keys(exportValue));
    }
  }
  return mocked;
};

vi.mock(import('./Crypto.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  registerUnmock(mocked.Crypto, actual.Crypto);
  return mocked;
});

vi.mock(import('./constants.js'), async (importActual) => {
  const mocked = await importActual();
  return {
    ...mocked,
    __developmentMode: false
  };
});

export const __unregisterExitAsyncTask = vi.fn();
export let __lastRegisteredExitAsyncTask: IAsyncTask;
let _ExitShutdownError: typeof ExitShutdownErrorType;

vi.mock(import('./Exit.js'), async (importActual) => {
  const actual = await importActual();
  _ExitShutdownError = actual.ExitShutdownError;
  const mocked = mockStaticMethodsOfExports(actual);
  const { Exit } = mocked;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- unregister is not bound to the returned object
  vi.mocked(Exit.registerAsyncTask).mockImplementation((task) => {
    __lastRegisteredExitAsyncTask = task;
    return { [Symbol.dispose]: __unregisterExitAsyncTask };
  });
  return mocked;
});

vi.mock(import('./FileSystem.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  const { FileSystem } = mocked;
  const writeStream = {
    write: vi.fn().mockImplementation((_: unknown, callback: () => void) => callback()),
    end: vi.fn()
  } as unknown as WriteStream;
  vi.mocked(FileSystem.createWriteStream).mockReturnValue(writeStream);
  const readStream = {} as ReadStream;
  vi.mocked(FileSystem.createReadStream).mockReturnValue(readStream);
  registerUnmock(FileSystem, actual.FileSystem);
  return mocked;
});

vi.mock(import('./Host.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  const { Host } = mocked;
  vi.mocked(Host.cpus).mockReturnValue([]);
  vi.mocked(Host.cwd).mockReturnValue(MOCK_CWD);
  registerUnmock(Host, actual.Host);
  return mocked;
});

vi.mock(import('./Http.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  registerUnmock(mocked.Http, actual.Http);
  return mocked;
});

vi.mock(import('./Module.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  registerUnmock(mocked.Module, actual.Module);
  return mocked;
});

const logger = {
  start: vi.fn(() => Promise.resolve()),
  debug: vi.fn().mockImplementation((attributes) => console.debug(attributes)),
  info: vi.fn().mockImplementation((attributes) => console.log(attributes)),
  warn: vi.fn().mockImplementation((attributes) => console.warn(attributes)),
  error: vi.fn().mockImplementation((attributes) => console.error(attributes)),
  fatal: vi.fn().mockImplementation((attributes: LogAttributes) => {
    console.error(attributes);
    const error = new _ExitShutdownError();
    error.message = `logger.fatal [${attributes.source}] ${attributes.message}`;
    if (attributes.error !== undefined) {
      error.cause = attributes.error;
    }
    throw error;
  }) as unknown as ILoggerService['fatal'],
  stop: vi.fn()
} satisfies ILoggerService;

vi.mock(import('./logger.js'), () => ({ logger }));

vi.mock(import('./Path.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  const { Path } = mocked;
  // Normalize to unix-like file system
  vi.mocked(Path.basename).mockImplementation((path) => basename(path));
  vi.mocked(Path.dirname).mockImplementation((path) => join(path, '..').replaceAll('\\', '/'));
  vi.mocked(Path.extname).mockImplementation((path) => extname(path));
  vi.mocked(Path.isAbsolute).mockImplementation((path) => path.startsWith('/') || path.startsWith('~/'));
  vi.mocked(Path.join).mockImplementation((...arguments_: string[]) => join(...arguments_).replaceAll('\\', '/'));
  vi.mocked(Path.relative).mockImplementation((from, to) => relative(from, to).replaceAll('\\', '/'));
  registerUnmock(Path, actual.Path);
  return mocked;
});

vi.mock(import('./Process.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  const { Process } = mocked;
  vi.mocked(Process.sleep).mockImplementation((ms) => setTimeout(ms));
  registerUnmock(Process, actual.Process);
  return mocked;
});

type TerminalRawMode = Parameters<typeof Terminal.setRawMode>[0];
export let __lastTerminalRawModeCallback: TerminalRawMode = false;

vi.mock(import('./Terminal.js'), async (importActual) => {
  const actual = await importActual();
  const originalstripVTControlCharacters = actual.Terminal.stripVTControlCharacters;
  const mocked = mockStaticMethodsOfExports(actual);
  const { Terminal } = mocked;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- useless control
  vi.mocked(Terminal.setRawMode).mockImplementation((callback: TerminalRawMode) => {
    __lastTerminalRawModeCallback = callback;
  });
  vi.mocked(Terminal.stripVTControlCharacters).mockImplementation(originalstripVTControlCharacters);
  return mocked;
});

vi.mock(import('./Thread.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExports(await importActual());
  const { Thread } = mocked;
  const channel = {
    postMessage: vi.fn().mockImplementation((data: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      channel.onmessage?.({ data } as any);
    }),
    onmessage: undefined as ((data: unknown) => void) | undefined,
    close: vi.fn()
  } as unknown as BroadcastChannel;
  vi.mocked(Thread.createBroadcastChannel).mockReturnValue(channel);
  const eventTarget = new EventTarget();
  const worker = eventTarget as unknown as Worker;
  Object.assign(worker, {
    on: eventTarget.addEventListener.bind(eventTarget),
    postMessage: vi.fn()
  });
  vi.mocked(Thread.createWorker).mockReturnValue(worker);
  return mocked;
});

vi.mock(import('./version.js'), () => ({
  version: vi.fn().mockResolvedValue({ name: 'ui5-test-runner', version: '1.2.3' })
}));

vi.mock(import('./ZLib.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  registerUnmock(mocked.ZLib, actual.ZLib);
  return mocked;
});

vi.mock(import('./Url.js'), async (importActual) => {
  const actual = await importActual();
  const mocked = mockStaticMethodsOfExports(actual);
  registerUnmock(mocked.Url, actual.Url);
  return mocked;
});
