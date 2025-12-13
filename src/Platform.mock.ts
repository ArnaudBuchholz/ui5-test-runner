import type { WriteStream } from 'node:fs';
import type { BroadcastChannel, Worker } from 'node:worker_threads';
import type { Gzip } from 'node:zlib';
import { vi } from 'vitest';

vi.mock(import('./Platform.js'), async (importActual) => {
  const actual = await importActual();
  const channel = {
    postMessage: vi.fn().mockImplementation((data: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      channel.onmessage?.({ data } as any);
    }),
    onmessage: undefined as ((data: unknown) => void) | undefined,
    close: vi.fn()
  } as unknown as BroadcastChannel;
  const writeStream = {} as WriteStream;
  const gzipStream = {
    pipe: vi.fn(),
    write: vi.fn(),
    end: vi.fn()
  } as unknown as Gzip;
  const eventTarget = new EventTarget();
  const worker = eventTarget as unknown as Worker;
  Object.assign(worker, {
    on: eventTarget.addEventListener.bind(eventTarget),
    postMessage: vi.fn()
  });
  return {
    ...actual,
    Platform: {
      ...actual.Platform,
      sourcesRoot: actual.Platform.sourcesRoot,
      writeOnTerminal: vi.fn(),
      createWriteStream: vi.fn(() => writeStream),
      readFile: vi.fn(),
      writeFileSync: vi.fn(),
      createBroadcastChannel: vi.fn(() => channel),
      createWorker: vi.fn(() => worker),
      createGzip: vi.fn(() => gzipStream),
      registerSigIntHandler: vi.fn(),
      onTerminalResize: vi.fn()
    }
  } as unknown as typeof actual;
});
