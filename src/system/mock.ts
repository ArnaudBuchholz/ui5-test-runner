import { vi } from 'vitest';
import type { WriteStream } from 'node:fs';
import type { BroadcastChannel, Worker } from 'node:worker_threads';
import type { Gzip } from 'node:zlib';

const mockStaticMethodsOfExportedClasses = <T extends object>(actual: T): T => {
  const mocked = { ...actual };
  for (const exportName in mocked) {
    const exportValue = mocked[exportName as keyof T];
    if (typeof exportValue === 'function') {
      const exportClass = exportValue as Record<string, unknown>;
      for (const staticName in exportValue) {
        const staticValue = exportClass[staticName];
        if (typeof staticValue === 'function') {
          exportClass[staticName] = vi.fn();
        }
      }
    }
  }
  return mocked;
}

vi.mock(import('./Exit.js'), async (importActual) => mockStaticMethodsOfExportedClasses(await importActual()));

vi.mock(import('./FileSystem.js'), async (importActual) => {
  const mocked = mockStaticMethodsOfExportedClasses(await importActual());
  const { FileSystem } = mocked;
  const writeStream = {} as WriteStream;
  vi.mocked(FileSystem.createWriteStream).mockReturnValue(writeStream);
  return mocked;
});

vi.mock(import('./Http.js'), async (importActual) => mockStaticMethodsOfExportedClasses(await importActual()));

vi.mock(import('./Process.js'), async (importActual) => mockStaticMethodsOfExportedClasses(await importActual()));

vi.mock(import('./Terminal.js'), async (importActual) => mockStaticMethodsOfExportedClasses(await importActual()));

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
