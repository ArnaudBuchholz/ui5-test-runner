import { it, expect, vi } from 'vitest';
import { FileSystem } from '../../system/index.js';
import { folderRecreate } from './folderRecreate.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';
import type { Configuration } from '../Configuration.js';
import { OptionValidationError } from '../OptionValidationError.js';

const VALID_ROOT = '/usr/arnaud/git/' as const;
const VALID_FOLDER_NAME = 'project' as const;
const VALID_PATH = VALID_ROOT + VALID_FOLDER_NAME;
const READ_ONLY_PATH = VALID_ROOT + 'read-only';
const readOnlyAccessError: Error & { code?: string } = new Error('read-only');
readOnlyAccessError.code = 'EACCES';
const NOT_EXISTING_PATH = VALID_ROOT + 'not-exist';
const notExistAccessError: Error & { code?: string } = new Error('read-only');
notExistAccessError.code = 'ENOENT';
const INVALID_ACCESS_PATH = VALID_ROOT + 'invalid-access';
const invalidAccess = new Error('Invalid access');
const INVALID_STAT_PATH = VALID_ROOT + 'invalid-stat';
const invalidStat = new Error('Invalid stat');
const FILE_PATH = VALID_ROOT + 'file';

vi.spyOn(FileSystem, 'access').mockImplementation((path, mode) => {
  expect(mode).toStrictEqual(FileSystem.constants.R_OK | FileSystem.constants.W_OK);
  if (path === VALID_PATH || path === INVALID_STAT_PATH || path === FILE_PATH) {
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
  description: 'Folder-recreate option',
  name: 'folder-recreate',
  type: 'folder-recreate'
} as const;

checkValidator({
  validator: folderRecreate,
  option: OPTION,
  valid: [
    { value: VALID_PATH, expected: VALID_PATH },
    { value: VALID_FOLDER_NAME, expected: VALID_PATH, configuration: { cwd: VALID_ROOT } },
    { value: NOT_EXISTING_PATH, expected: NOT_EXISTING_PATH }
  ],
  invalid: [
    { value: READ_ONLY_PATH },
    { value: INVALID_STAT_PATH },
    { value: INVALID_ACCESS_PATH },
    { value: FILE_PATH },
    ...noBooleans,
    ...noIntegers,
    ...noNumbers
  ]
});

it('sets the cause when returning the error (read-only-access)', async () => {
  try {
    await folderRecreate(OPTION, READ_ONLY_PATH, {} as Configuration);
    expect.unreachable();
  } catch (error) {
    expect.assert(error instanceof OptionValidationError);
    expect(error.cause).toStrictEqual(readOnlyAccessError);
  }
});

it('sets the cause when returning the error (invalid-stat)', async () => {
  try {
    await folderRecreate(OPTION, INVALID_STAT_PATH, {} as Configuration);
    expect.unreachable();
  } catch (error) {
    expect.assert(error instanceof OptionValidationError);
    expect(error.cause).toStrictEqual(invalidStat);
  }
});
