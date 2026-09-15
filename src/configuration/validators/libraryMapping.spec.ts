import { vi } from 'vitest';
import { FileSystem } from '../../platform/index.js';
import { lib } from './libraryMapping.js';
import { checkValidator } from './checkValidator.test.js';

const VALID_ROOT = '/project/';
const VALID_FOLDER_PATH = '/project/src/my-lib';
const VALID_ABS_FOLDER_PATH = '/external/src/my-lib';

vi.mocked(FileSystem.access).mockImplementation((path) => {
  if ([VALID_FOLDER_PATH, VALID_ABS_FOLDER_PATH].includes(path.toString())) {
    return Promise.resolve();
  }
  const error: Error & { code?: string } = new Error('not found');
  error.code = 'ENOENT';
  return Promise.reject(error);
});

vi.mocked(FileSystem.stat).mockImplementation((path) => {
  if ([VALID_FOLDER_PATH, VALID_ABS_FOLDER_PATH].includes(path.toString())) {
    return Promise.resolve({
      isDirectory: () => true,
      isFile: () => false
    } as Awaited<ReturnType<typeof FileSystem.stat>>);
  }
  return Promise.reject(new Error('stat error'));
});

checkValidator({
  validator: lib,
  option: {
    description: 'Library mapping',
    name: 'lib',
    type: 'library-mapping',
    multiple: true
  },
  valid: [
    {
      value: 'resources/my-lib=src/my-lib',
      configuration: { cwd: VALID_ROOT },
      expected: { resourcesSubFolder: 'resources/my-lib', sourceFolder: VALID_FOLDER_PATH }
    },
    {
      value: 'src/my-lib',
      configuration: { cwd: VALID_ROOT },
      expected: { resourcesSubFolder: 'src/my-lib', sourceFolder: VALID_FOLDER_PATH }
    },
    {
      value: { resourcesSubFolder: 'resources/my-lib', sourceFolder: 'src/my-lib' },
      configuration: { cwd: VALID_ROOT },
      expected: { resourcesSubFolder: 'resources/my-lib', sourceFolder: VALID_FOLDER_PATH }
    },
    {
      value: { resourcesSubFolder: 'resources/my-lib', sourceFolder: VALID_ABS_FOLDER_PATH },
      configuration: { cwd: VALID_ROOT },
      expected: { resourcesSubFolder: 'resources/my-lib', sourceFolder: VALID_ABS_FOLDER_PATH }
    }
  ],
  invalid: [
    {
      value: 'resources/my-lib=src/my-lib2',
      configuration: { cwd: VALID_ROOT }
    },
    { value: 'a=b=c' },
    { value: 123 },
    { value: true },
    { value: { resourcesSubFolder: 'resources/my-lib' } },
    { value: { sourceFolder: 'src/my-lib' } },
    { value: { resourcesSubFolder: 123, sourceFolder: 'src/my-lib' } },
    { value: { resourcesSubFolder: 'resources/my-lib', sourceFolder: 456 } }
  ]
});
