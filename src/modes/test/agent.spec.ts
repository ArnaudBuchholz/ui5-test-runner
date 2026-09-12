import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystem } from '../../platform/index.js';

const AGENT_SRC = 'AGENT_SRC';

beforeEach(() => vi.clearAllMocks());

describe('getAgentSource (prod mode, memoization isolated)', () => {
  let getAgentSource: () => Promise<string>;

  beforeEach(async () => {
    vi.resetModules();
    const agentModule = await import('./agent.js');
    getAgentSource = agentModule.getAgentSource;
    vi.mocked(FileSystem.readFile).mockResolvedValue(AGENT_SRC);
  });

  it('returns file contents from FileSystem.readFile', async () => {
    await expect(getAgentSource()).resolves.toBe(AGENT_SRC);
  });

  it('reads a path ending with ui/agent.js in production mode', async () => {
    await getAgentSource();
    expect(FileSystem.readFile).toHaveBeenCalledWith(expect.stringContaining('ui/agent.js'), 'utf8');
  });

  it('does not contain dist in the production path', async () => {
    await getAgentSource();
    const calledPath = vi.mocked(FileSystem.readFile).mock.calls[0]![0] as string;
    expect(calledPath).not.toContain('dist/ui');
  });

  it('memoizes: FileSystem.readFile is called exactly once across two calls', async () => {
    await getAgentSource();
    await getAgentSource();
    expect(FileSystem.readFile).toHaveBeenCalledOnce();
  });
});

describe('getAgentSource (dev mode)', () => {
  it('reads a path containing dist/ui in development mode', async () => {
    vi.resetModules();
    vi.doMock('../../platform/constants.js', async (orig) => ({
      ...(await orig()),
      __developmentMode: true
    }));
    const { getAgentSource } = await import('./agent.js');
    vi.mocked(FileSystem.readFile).mockResolvedValue(AGENT_SRC);
    await getAgentSource();
    expect(FileSystem.readFile).toHaveBeenCalledWith(expect.stringContaining('dist/ui'), 'utf8');
    vi.doUnmock('../../platform/constants.js');
  });
});
