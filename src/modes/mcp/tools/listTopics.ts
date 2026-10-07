import { getIndex } from '../knowledgeBase.js';

const JSON_INDENT = 2;

export const toolDefinitionListTopics = {
  definition: {
    name: 'list_topics',
    description:
      'List every documentation entity as a flat catalog (id, type, title, summary, relations). Call this first, match a question against the titles and summaries, then pass the chosen id to get_topic.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  handler: (_arguments: Record<string, unknown>): Promise<string> =>
    Promise.resolve(JSON.stringify(getIndex().catalog, null, JSON_INDENT))
};
