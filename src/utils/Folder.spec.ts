import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { FileSystem, logger } from '../platform/index.js';
import { Folder } from './Folder.js';

beforeEach(() => vi.clearAllMocks());

const PATH = '/usr/arnaud/test';

describe('Folder.clean', () => {
  it('logs the action', async () => {
    await Folder.clean(PATH);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'job',
        message: `Cleaning folder: ${PATH}`
      })
    );
  });

  it('uses stat to check if it exists', async () => {
    await Folder.clean(PATH);
    expect(FileSystem.stat).toHaveBeenCalledWith(PATH);
  });

  it('removes the folder recursively', async () => {
    await Folder.clean(PATH);
    expect(FileSystem.rm).toHaveBeenCalledWith(PATH, { recursive: true });
  });

  it('calls stat before rm', async () => {
    const order: string[] = [];
    vi.mocked(FileSystem.stat).mockImplementationOnce(() => {
      order.push('stat');
      return Promise.resolve({}) as ReturnType<typeof FileSystem.stat>;
    });
    vi.mocked(FileSystem.rm).mockImplementationOnce(() => {
      order.push('rm');
      return Promise.resolve();
    });

    await Folder.clean(PATH);

    expect(order).toEqual(['stat', 'rm']);
  });
});

describe(Folder.create, () => {
  it('logs the action', async () => {
    await Folder.create(PATH);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'job',
        message: `Creating folder: ${PATH}`
      })
    );
  });

  it('create the folder recursively', async () => {
    await Folder.create(PATH);
    expect(FileSystem.mkdir).toHaveBeenCalledWith(PATH, { recursive: true });
  });

  it('wraps the error', async () => {
    const cause = new Error('NOPE');
    vi.mocked(FileSystem.mkdir).mockImplementationOnce(() => {
      throw cause;
    });
    try {
      await Folder.create(PATH);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({
        name: 'Error',
        message: `Failed to create folder: ${PATH}`,
        cause
      });
    }
  });
});

describe('Folder.recreate', () => {
  beforeAll(() => {
    vi.spyOn(Folder, 'clean');
    vi.spyOn(Folder, 'create');
  });

  it('calls Folder.clean', async () => {
    await Folder.recreate(PATH);
    expect(Folder.clean).toHaveBeenCalledWith(PATH);
  });

  it('calls Folder.create', async () => {
    await Folder.recreate(PATH);
    expect(Folder.create).toHaveBeenCalledWith(PATH);
  });

  it('calls clean before create', async () => {
    const order: string[] = [];
    vi.mocked(Folder.clean).mockImplementationOnce(() => {
      order.push('clean');
      return Promise.resolve();
    });
    vi.mocked(Folder.create).mockImplementationOnce(() => {
      order.push('create');
      return Promise.resolve();
    });

    await Folder.recreate(PATH);

    expect(order).toEqual(['clean', 'create']);
  });
});
