import { vi } from 'vitest';
import type { ReadStream, WriteStream } from 'node:fs';
import type { BroadcastChannel, Worker } from 'node:worker_threads';
import { join } from 'node:path';
import type { ILoggerService } from './logger/ILogger.js';
import type { IAsyncTask } from './Exit.js';
import type { Terminal } from './Terminal.js';

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
    // eslint-disable-next-line unicorn/no-unsafe-property-key -- safe because enumerated
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

vi.mock(import('./constants.js'), async (importActual) => {
  const mocked = await importActual();
  return {
    ...mocked,
    __developmentMode: false
  };
});

export const __unregisterExitAsyncTask = vi.fn();
export let __lastRegisteredExitAsyncTask: IAsyncTask;

vi.mock(import('./Exit.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExports(await importActual());
  const { Exit } = mocked;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- unregister is not bound to the returned object
  vi.mocked(Exit.registerAsyncTask).mockImplementation((task) => {
    __lastRegisteredExitAsyncTask = task;
    return { [Symbol.dispose]: __unregisterExitAsyncTask };
  });
  return mocked;
});

vi.mock(import('./FileSystem.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExports(await importActual());
  const { FileSystem } = mocked;
  const writeStream = {
    write: vi.fn().mockImplementation((_: unknown, callback: () => void) => callback()),
    end: vi.fn()
  } as unknown as WriteStream;
  vi.mocked(FileSystem.createWriteStream).mockReturnValue(writeStream);
  const readStream = {} as ReadStream;
  vi.mocked(FileSystem.createReadStream).mockReturnValue(readStream);
  return mocked;
});

vi.mock(import('./Host.js'), async (importActual) => mockStaticMethodsOfExports(await importActual()));

vi.mock(import('./Http.js'), async (importActual) => mockStaticMethodsOfExports(await importActual()));

vi.mock(import('./Module.js'), async (importActual) => mockStaticMethodsOfExports(await importActual()));

const logger = {
  start: vi.fn(() => Promise.resolve()),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  stop: vi.fn()
} satisfies ILoggerService;

vi.mock(import('./logger.js'), () => ({ logger }));

vi.mock(import('./Path.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExports(await importActual());
  const { Path } = mocked;
  // Normalize to unix-like file system
  vi.mocked(Path.dirname).mockImplementation((path) => join(path, '..').replaceAll('\\', '/'));
  vi.mocked(Path.isAbsolute).mockImplementation((path) => path.startsWith('/'));
  vi.mocked(Path.join).mockImplementation((...arguments_: string[]) => join(...arguments_).replaceAll('\\', '/'));
  return mocked;
});

vi.mock(import('./Process.js'), async (importActual) => mockStaticMethodsOfExports(await importActual()));

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
  version: vi.fn().mockResolvedValue('ui5-test-runner@1.2.3')
}));

vi.mock(import('./ZLib.js'), async (importActual) => mockStaticMethodsOfExports(await importActual()));

vi.mock(import('./Url.js'), async (importActual) => mockStaticMethodsOfExports(await importActual()));
