import { vi } from 'vitest';
import type { WriteStream } from 'node:fs';
import type { BroadcastChannel, Worker } from 'node:worker_threads';
import type { Gzip } from 'node:zlib';
import { join } from 'node:path';
import type { ILogger } from './logger/types.js';
import type { IAsyncTask } from './Exit.js';
import type { Terminal } from './Terminal.js';

const mockStaticMethodsOfExportedClasses = <T extends object>(actual: T): T => {
  const mocked = { ...actual };
  for (const exportName in mocked) {
    const exportValue = mocked[exportName as keyof T];
    if (typeof exportValue === 'function') {
      const exportClass = exportValue as Record<string, unknown>;
      for (const staticName of Object.getOwnPropertyNames(exportValue)) {
        const staticValue = exportClass[staticName];
        if (typeof staticValue === 'function') {
          exportClass[staticName] = vi.fn();
        }
      }
    }
  }
  return mocked;
};

const logger = {
  start: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  stop: vi.fn()
} satisfies ILogger;

vi.mock(import('./logger.js'), () => ({ logger }));

export const __unregisterExitAsyncTask = vi.fn();
export let __lastRegisteredExitAsyncTask: IAsyncTask;

vi.mock(import('./Exit.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExportedClasses(await importActual());
  const { Exit } = mocked;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- unregister is not bound to the returned object
  vi.mocked(Exit.registerAsyncTask).mockImplementation((task) => {
    __lastRegisteredExitAsyncTask = task;
    return { unregister: __unregisterExitAsyncTask };
  });
  return mocked;
});

vi.mock(import('./FileSystem.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExportedClasses(await importActual());
  const { FileSystem } = mocked;
  const writeStream = {} as WriteStream;
  vi.mocked(FileSystem.createWriteStream).mockReturnValue(writeStream);
  return mocked;
});

vi.mock(import('./Host.js'), async (importActual) => mockStaticMethodsOfExportedClasses(await importActual()));

vi.mock(import('./Http.js'), async (importActual) => mockStaticMethodsOfExportedClasses(await importActual()));

vi.mock(import('./Path.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExportedClasses(await importActual());
  const { Path } = mocked;
  // Normalize to unix-like file system
  vi.mocked(Path.isAbsolute).mockImplementation((path) => path.startsWith('/'));
  vi.mocked(Path.join).mockImplementation((...arguments_: string[]) => join(...arguments_).replaceAll('\\', '/'));
  return mocked;
});

vi.mock(import('./Process.js'), async (importActual) => mockStaticMethodsOfExportedClasses(await importActual()));

type TerminalRawMode = Parameters<typeof Terminal.setRawMode>[0];
export let __lastTerminalRawModeCallback: TerminalRawMode = false;

vi.mock(import('./Terminal.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExportedClasses(await importActual());
  const { Terminal } = mocked;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- useless control
  vi.mocked(Terminal.setRawMode).mockImplementation((callback: TerminalRawMode) => {
    __lastTerminalRawModeCallback = callback;
  });
  return mocked;
});

vi.mock(import('./Thread.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExportedClasses(await importActual());
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

vi.mock(import('./ZLib.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExportedClasses(await importActual());
  const { ZLib } = mocked;
  const gzipStream = {
    pipe: vi.fn(),
    write: vi.fn(),
    end: vi.fn()
  } as unknown as Gzip;
  vi.mocked(ZLib.createGzip).mockReturnValue(gzipStream);
  return mocked;
});
