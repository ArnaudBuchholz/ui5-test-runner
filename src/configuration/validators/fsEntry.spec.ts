import { it, expect, vi, describe } from 'vitest';
import { FileSystem, Host } from '../../platform/index.js';
import { fsEntry } from './fsEntry.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';
import type { Configuration } from '../Configuration.js';
import { OptionValidationError } from '../OptionValidationError.js';
import { indexedOptions } from '../indexedOptions.js';

const VALID_ROOT = '/usr/arnaud/git/' as const;
const VALID_FOLDER_NAME = 'folder' as const;
const VALID_FOLDER_PATH = VALID_ROOT + VALID_FOLDER_NAME;
const READ_ONLY_PATH = VALID_ROOT + 'read-only';
const readOnlyAccessError: Error & { code?: string } = new Error('read-only');
readOnlyAccessError.code = 'EACCES';
const NOT_EXISTING_PATH = VALID_ROOT + 'not-exist';
const notExistAccessError: Error & { code?: string } = new Error('read-only');
notExistAccessError.code = 'ENOENT';
const INVALID_ACCESS_NAME = 'invalid-access';
const INVALID_ACCESS_PATH = VALID_ROOT + INVALID_ACCESS_NAME;
const invalidAccess = new Error('Invalid access');
const INVALID_STAT_PATH = VALID_ROOT + 'invalid-stat';
const invalidStat = new Error('Invalid stat');
const VALID_FILE_NAME = 'file' as const;
const VALID_FILE_PATH = VALID_ROOT + VALID_FILE_NAME;

vi.mocked(FileSystem.access).mockImplementation((path) => {
  if (path === VALID_FOLDER_PATH || path === INVALID_STAT_PATH || path === VALID_FILE_PATH) {
    return Promise.resolve();
  }
  if (path === READ_ONLY_PATH) {
    return Promise.reject(readOnlyAccessError);
  }
  if (path === NOT_EXISTING_PATH) {
    return Promise.reject(notExistAccessError);
  }
  return Promise.reject(invalidAccess);
});

vi.mocked(FileSystem.stat).mockImplementation((path) => {
  if (path === VALID_FOLDER_PATH) {
    return Promise.resolve({
      isDirectory: () => true,
      isFile: () => false
    } as Awaited<ReturnType<typeof FileSystem.stat>>);
  }
  if (path === VALID_FILE_PATH) {
    return Promise.resolve({
      isDirectory: () => false,
      isFile: () => true
    } as Awaited<ReturnType<typeof FileSystem.stat>>);
  }
  return Promise.reject(invalidStat);
});

const FS_OPTION = {
  description: 'Fs-entry option',
  name: 'fs-entry',
  type: 'fs-entry'
} as const;

describe('(no modifiers)', () => {
  const FOLDER = {
    ...FS_OPTION
  } as const;

  checkValidator({
    validator: fsEntry,
    option: FOLDER,
    valid: [
      { value: VALID_FOLDER_PATH, expected: VALID_FOLDER_PATH },
      { value: VALID_FOLDER_NAME, expected: VALID_FOLDER_PATH, configuration: { cwd: VALID_ROOT } }
    ],
    invalid: [
      { value: INVALID_ACCESS_PATH },
      { value: INVALID_STAT_PATH },
      { value: VALID_FILE_PATH },
      ...noBooleans,
      ...noIntegers,
      ...noNumbers
    ]
  });

  it('checks only if readable', async () => {
    vi.mocked(FileSystem.access).mockClear();
    await fsEntry(FOLDER, VALID_FOLDER_PATH, {} as Configuration);
    expect(FileSystem.access).toHaveBeenCalledWith(VALID_FOLDER_PATH, FileSystem.constants.R_OK);
  });

  it('sets the cause when returning the error (invalid-access)', async () => {
    try {
      await fsEntry(FOLDER, INVALID_ACCESS_PATH, {} as Configuration);
      expect.unreachable();
    } catch (error) {
      expect.assert(error instanceof OptionValidationError);
      expect(error.cause).toStrictEqual(invalidAccess);
    }
  });

  it('sets the cause when returning the error (invalid-stat)', async () => {
    try {
      await fsEntry(FOLDER, INVALID_STAT_PATH, {} as Configuration);
      expect.unreachable();
    } catch (error) {
      expect.assert(error instanceof OptionValidationError);
      expect(error.cause).toStrictEqual(invalidStat);
    }
  });

  describe('exceptions', () => {
    it('handles: cwd is relative to Host.cwd()', async () => {
      const { cwd: option } = indexedOptions;
      vi.mocked(Host.cwd).mockReturnValue(VALID_ROOT);
      const result = await fsEntry(option, VALID_FOLDER_NAME, {} as Configuration);
      expect(result).toStrictEqual(VALID_FOLDER_PATH);
    });

    it('handles: webapp may not exist', async () => {
      const { webapp: option } = indexedOptions;
      const result = await fsEntry(option, INVALID_ACCESS_NAME, { cwd: VALID_ROOT } as Configuration);
      expect(result).toStrictEqual('');
    });
  });
});

describe('overwrite', () => {
  const FOLDER_OVERWRITE = {
    ...FS_OPTION,
    typeModifiers: new Set(['overwrite'] as const)
  } as const;

  checkValidator({
    validator: fsEntry,
    option: FOLDER_OVERWRITE,
    valid: [
      { value: VALID_FOLDER_PATH, expected: VALID_FOLDER_PATH },
      { value: VALID_FOLDER_NAME, expected: VALID_FOLDER_PATH, configuration: { cwd: VALID_ROOT } },
      { value: NOT_EXISTING_PATH, expected: NOT_EXISTING_PATH }
    ],
    invalid: [
      { value: READ_ONLY_PATH },
      { value: INVALID_STAT_PATH },
      { value: INVALID_ACCESS_PATH },
      { value: VALID_FILE_PATH },
      ...noBooleans,
      ...noIntegers,
      ...noNumbers
    ]
  });

  it('checks if readable and writable', async () => {
    vi.mocked(FileSystem.access).mockClear();
    await fsEntry(FOLDER_OVERWRITE, VALID_FOLDER_PATH, {} as Configuration);
    expect(FileSystem.access).toHaveBeenCalledWith(
      VALID_FOLDER_PATH,
      FileSystem.constants.R_OK | FileSystem.constants.W_OK
    );
  });

  it('sets the cause when returning the error (read-only-access)', async () => {
    try {
      await fsEntry(FOLDER_OVERWRITE, READ_ONLY_PATH, {} as Configuration);
      expect.unreachable();
    } catch (error) {
      expect.assert(error instanceof OptionValidationError);
      expect(error.cause).toStrictEqual(readOnlyAccessError);
    }
  });

  it('sets the cause when returning the error (invalid-stat)', async () => {
    try {
      await fsEntry(FOLDER_OVERWRITE, INVALID_STAT_PATH, {} as Configuration);
      expect.unreachable();
    } catch (error) {
      expect.assert(error instanceof OptionValidationError);
      expect(error.cause).toStrictEqual(invalidStat);
    }
  });
});

describe('file', () => {
  const FILE = {
    ...FS_OPTION,
    typeModifiers: new Set(['file'] as const)
  } as const;

  checkValidator({
    validator: fsEntry,
    option: FILE,
    valid: [
      { value: VALID_FILE_PATH, expected: VALID_FILE_PATH },
      { value: VALID_FILE_NAME, expected: VALID_FILE_PATH, configuration: { cwd: VALID_ROOT } }
    ],
    invalid: [
      { value: INVALID_ACCESS_PATH },
      { value: INVALID_STAT_PATH },
      { value: VALID_FOLDER_PATH },
      ...noBooleans,
      ...noIntegers,
      ...noNumbers
    ]
  });

  it('sets the cause when returning the error (invalid-access)', async () => {
    try {
      await fsEntry(FILE, INVALID_ACCESS_PATH, {} as Configuration);
      expect.unreachable();
    } catch (error) {
      expect.assert(error instanceof OptionValidationError);
      expect(error.cause).toStrictEqual(invalidAccess);
    }
  });

  it('sets the cause when returning the error (invalid-stat)', async () => {
    try {
      await fsEntry(FILE, INVALID_STAT_PATH, {} as Configuration);
      expect.unreachable();
    } catch (error) {
      expect.assert(error instanceof OptionValidationError);
      expect(error.cause).toStrictEqual(invalidStat);
    }
  });

  describe('exceptions', () => {
    it('handles: config may not exist if default', async () => {
      const { config: option } = indexedOptions;
      const result = await fsEntry(option, 'ui5-test-runner.json', { cwd: VALID_ROOT } as Configuration);
      expect(result).toStrictEqual('');
    });

    it('handles: config must fail otherwise', async () => {
      const { config: option } = indexedOptions;
      try {
        await fsEntry(option, INVALID_ACCESS_NAME, { cwd: VALID_ROOT, config: INVALID_ACCESS_NAME } as Configuration);
        expect.unreachable();
      } catch (error) {
        expect.assert(error instanceof OptionValidationError);
        expect(error.cause).toStrictEqual(invalidAccess);
      }
    });
  });
});
