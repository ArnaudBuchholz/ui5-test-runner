import { readFile } from '../knowledgeBase.js';

export const toolDefinitionListTopics = {
  definition: {
    name: 'list_topics',
    description: 'List all available documentation topics. Call this first to discover what is available.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  handler: async (_arguments: Record<string, unknown>): Promise<string> => readFile('index.md')
};
