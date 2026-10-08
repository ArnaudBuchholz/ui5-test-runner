import type { McpTool } from './mcpClient.js';

/**
 * Exposes the test case's `[files]` section as a read-only tool so the model under test can
 * *probe* for files the way a real agent would — following the KB's instructions to read a
 * file (e.g. a project's `package.json`) rather than being handed a listing. There is
 * deliberately no "list files" tool: the model learns which files to try from the retrieved
 * documentation, and a miss returns an error, which is the signal that the file is absent.
 */
export function buildFileTools(files: Record<string, string>): McpTool[] {
  return [
    {
      name: 'read_file',
      description:
        'Read the content of a project file at the given path. Returns an error if the file does not exist.',
      parameters: {
        path: { type: 'string', description: 'Path of the file to read, relative to the project root.' }
      },
      execute: (arguments_: Record<string, unknown>): Promise<string> => {
        const path = typeof arguments_['path'] === 'string' ? arguments_['path'] : '';
        return Promise.resolve(path in files ? files[path]!.trim() : `Error: file "${path}" does not exist`);
      }
    }
  ];
}
