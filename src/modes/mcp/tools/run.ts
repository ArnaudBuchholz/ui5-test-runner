import { Path, Process, __sourcesRoot } from '../../../platform/index.js';

export const run = {
  definition: {
    name: 'run',
    description: 'Execute ui5-test-runner with the provided CLI arguments.',
    inputSchema: {
      type: 'object',
      properties: {
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'CLI arguments to pass to ui5-test-runner'
        }
      },
      required: ['args']
    }
  },
  handler: async (arguments_: Record<string, unknown>): Promise<string> => {
    const proc = Process.spawn('node', [Path.join(__sourcesRoot, 'dist/cli.js'), ...(arguments_['args'] as string[])], {
      stdio: 'pipe'
    });
    await proc.closed;
    const output = [proc.stdout, proc.stderr].filter(Boolean).join('\n');
    return `Exit code: ${proc.code}\n${output}`;
  }
};
