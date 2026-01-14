import { it, expect, vi } from 'vitest';
import { FileSystem } from '../../system/index.js';
import { folder } from './folder.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';
import type { Configuration } from '../Configuration.js';
import { OptionValidationError } from '../OptionValidationError.js';

const VALID_ROOT = '/usr/arnaud/git/' as const;
const VALID_FOLDER_NAME = 'project' as const;
const VALID_PATH = VALID_ROOT + VALID_FOLDER_NAME;
const INVALID_ACCESS_PATH = VALID_ROOT + 'invalid-access';
const invalidAccess = new Error('Invalid access');
const INVALID_STAT_PATH = VALID_ROOT + 'invalid-stat';
const invalidStat = new Error('Invalid stat');
const FILE_PATH = VALID_ROOT + 'file';

vi.spyOn(FileSystem, 'access').mockImplementation((path) => {
  if (path === VALID_PATH || path === INVALID_STAT_PATH || path === FILE_PATH) {
    return Promise.resolve();
  }
  return Promise.reject(invalidAccess);
});

vi.spyOn(FileSystem, 'stat').mockImplementation((path) => {
  if (path === VALID_PATH) {
    return Promise.resolve({
      isDirectory: () => true
    } as Awaited<ReturnType<typeof FileSystem.stat>>);
  }
  if (path === FILE_PATH) {
    return Promise.resolve({
      isDirectory: () => false
    } as Awaited<ReturnType<typeof FileSystem.stat>>);
  }
  return Promise.reject(invalidStat);
});

const OPTION = {
  description: 'Folder option',
  name: 'folder',
  type: 'folder'
} as const;

checkValidator({
  validator: folder,
  option: OPTION,
  valid: [
    { value: VALID_PATH, expected: VALID_PATH },
    { value: VALID_FOLDER_NAME, expected: VALID_PATH, configuration: { cwd: VALID_ROOT } }
  ],
  invalid: [
    { value: INVALID_ACCESS_PATH },
    { value: INVALID_STAT_PATH },
    { value: FILE_PATH },
    ...noBooleans,
    ...noIntegers,
    ...noNumbers
  ]
});

it('sets the cause when returning the error (invalid-access)', async () => {
  try {
    await folder(OPTION, INVALID_ACCESS_PATH, {} as Configuration);
    expect.unreachable();
  } catch (error) {
    expect.assert(error instanceof OptionValidationError);
    expect(error.cause).toStrictEqual(invalidAccess);
  }
});

it('sets the cause when returning the error (invalid-stat)', async () => {
  try {
    await folder(OPTION, INVALID_STAT_PATH, {} as Configuration);
    expect.unreachable();
  } catch (error) {
    expect.assert(error instanceof OptionValidationError);
    expect(error.cause).toStrictEqual(invalidStat);
  }
});
