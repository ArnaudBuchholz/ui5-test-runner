import { it, expect, vi } from 'vitest';
import { folder } from './folder.js';
import { checkValidator, noBooleans, noIntegers, noNumbers } from './checkValidator.test.js';
import { Platform } from '../../Platform.js';
import type { Configuration } from '../Configuration.js';
import { OptionValidationError } from '../OptionValidationError.js';

const VALID_ROOT = '/usr/arnaud/git/' as const;
const VALID_FOLDER_NAME = 'project' as const;
const VALID_PATH = VALID_ROOT + VALID_FOLDER_NAME;
const invalidAccess = new Error('Invalid access');
const INVALID_STAT = '/usr/invalid-stat' as const;
const invalidStat = new Error('Invalid stat');

vi.spyOn(Platform, 'access').mockImplementation(async (path) => {
  if (path === VALID_PATH || path === INVALID_STAT) {
    return;
  }
  throw invalidAccess;
});

vi.spyOn(Platform, 'stat').mockImplementation(async (path) => {
  if (path === VALID_PATH) {
    return {
      isDirectory: () => true
    } as Awaited<ReturnType<typeof Platform.stat>>;
  }
  throw invalidStat;
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
  invalid: [{ value: '/usr/invalid-access' }, { value: INVALID_STAT }, ...noBooleans, ...noIntegers, ...noNumbers]
});

it('sets the cause when returning the error (invalid-access)', async () => {
  try {
    await folder(OPTION, '/usr/invalid-access', {} as Configuration);
    expect.unreachable();
  } catch (error) {
    expect.assert(error instanceof OptionValidationError);
    expect(error.cause).toStrictEqual(invalidAccess);
  }
});

it('sets the cause when returning the error (invalid-stat)', async () => {
  try {
    await folder(OPTION, INVALID_STAT, {} as Configuration);
    expect.unreachable();
  } catch (error) {
    expect.assert(error instanceof OptionValidationError);
    expect(error.cause).toStrictEqual(invalidStat);
  }
});
