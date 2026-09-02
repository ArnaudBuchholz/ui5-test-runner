import { it, expect, vi, beforeEach } from 'vitest';
import { Exit } from '../platform/Exit.js';
import type { Configuration } from '../configuration/Configuration.js';
import { Modes } from './Modes.js';

vi.mock('./help.js', () => ({ help: vi.fn() }));

import { execute } from './execute.js';
import { help } from './help.js';

const HELP_CONFIGURATION = { mode: Modes.help } as unknown as Configuration;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Exit.shutdown).mockResolvedValue(undefined);
  vi.mocked(help).mockReturnValue(undefined);
});

it('calls the mode function and then shuts down', async () => {
  await execute(HELP_CONFIGURATION);
  expect(help).toHaveBeenCalledOnce();
  expect(Exit.shutdown).toHaveBeenCalledOnce();
});

it('calls Exit.shutdown even when the mode function throws', async () => {
  vi.mocked(help).mockImplementation(() => {
    throw new Error('mode error');
  });
  await expect(execute(HELP_CONFIGURATION)).rejects.toThrow('mode error');
  expect(Exit.shutdown).toHaveBeenCalledOnce();
});
