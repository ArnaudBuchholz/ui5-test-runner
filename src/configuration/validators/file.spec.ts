import { it, expect, vi } from 'vitest';
import { FileSystem } from '../../platform/index.js';
import { file } from './file.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';
import type { Configuration } from '../Configuration.js';
import { OptionValidationError } from '../OptionValidationError.js';

const VALID_ROOT = '/usr/arnaud/git/' as const;
const VALID_FILE_NAME = 'project' as const;
const VALID_PATH = VALID_ROOT + VALID_FILE_NAME;
const INVALID_ACCESS_PATH = VALID_ROOT + 'invalid-access';
const invalidAccess = new Error('Invalid access');
const INVALID_STAT_PATH = VALID_ROOT + 'invalid-stat';
const invalidStat = new Error('Invalid stat');
const FOLDER_PATH = VALID_ROOT + 'folder';

vi.mocked(FileSystem.access).mockImplementation((path) => {
  if (path === VALID_PATH || path === INVALID_STAT_PATH || path === FOLDER_PATH) {
    return Promise.resolve();
  }
  return Promise.reject(invalidAccess);
});

vi.mocked(FileSystem.stat).mockImplementation((path) => {
  if (path === VALID_PATH) {
    return Promise.resolve({
      isFile: () => true
    } as Awaited<ReturnType<typeof FileSystem.stat>>);
  }
  if (path === FOLDER_PATH) {
    return Promise.resolve({
      isFile: () => false
    } as Awaited<ReturnType<typeof FileSystem.stat>>);
  }
  return Promise.reject(invalidStat);
});

const OPTION = {
  description: 'File option',
  name: 'file',
  type: 'file'
} as const;

checkValidator({
  validator: file,
  option: OPTION,
  valid: [
    { value: VALID_PATH, expected: VALID_PATH },
    { value: VALID_FILE_NAME, expected: VALID_PATH, configuration: { cwd: VALID_ROOT } }
  ],
  invalid: [
    { value: INVALID_ACCESS_PATH },
    { value: INVALID_STAT_PATH },
    { value: FOLDER_PATH },
    ...noBooleans,
    ...noIntegers,
    ...noNumbers
  ]
});

it('sets the cause when returning the error (invalid-access)', async () => {
  try {
    await file(OPTION, INVALID_ACCESS_PATH, {} as Configuration);
    expect.unreachable();
  } catch (error) {
    expect.assert(error instanceof OptionValidationError);
    expect(error.cause).toStrictEqual(invalidAccess);
  }
});

it('sets the cause when returning the error (invalid-stat)', async () => {
  try {
    await file(OPTION, INVALID_STAT_PATH, {} as Configuration);
    expect.unreachable();
  } catch (error) {
    expect.assert(error instanceof OptionValidationError);
    expect(error.cause).toStrictEqual(invalidStat);
  }
});
