import { it, expect, vi } from 'vitest';
import { FileSystem } from './FileSystem.js';
import { version } from './version.js';

vi.mocked(FileSystem.readFile).mockResolvedValue(
  JSON.stringify({
    name: 'ui5-test-runner',
    version: '1.2.3'
  })
);

it('returns project version', async () => {
  await expect(version()).resolves.toStrictEqual('ui5-test-runner@1.2.3');
});
