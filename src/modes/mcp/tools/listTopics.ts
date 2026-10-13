import { getIndex } from '../knowledgeBase.js';

const JSON_INDENT = 2;

export const toolDefinitionListTopics = {
  definition: {
    name: 'list_topics',
    description:
      'Authoritative documentation catalog for ui5-test-runner. Call this whenever the user asks anything about ui5-test-runner — its options, flags, configuration keys, modes, coverage, reporting, migration, or error messages — BEFORE answering, and do not rely on prior knowledge (it is often wrong or outdated for this tool). Returns a flat catalog (id, type, title, summary, relations); match the question against the titles and summaries, then pass the chosen id to get_topic.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  handler: (_arguments: Record<string, unknown>): Promise<string> =>
    Promise.resolve(JSON.stringify(getIndex().catalog, null, JSON_INDENT))
};
