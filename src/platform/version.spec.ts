import { it, expect, vi } from 'vitest';
import { FileSystem } from './FileSystem.js';
import type { version as versionType } from './version.js';
const { version } = await vi.importActual<{ version: typeof versionType }>('./version.js');

vi.mocked(FileSystem.readFile).mockResolvedValue(
  JSON.stringify({
    name: 'ui5-test-runner',
    version: '1.2.3'
  })
);

it('returns project name and version', async () => {
  await expect(version()).resolves.toStrictEqual({ name: 'ui5-test-runner', version: '1.2.3' });
});
