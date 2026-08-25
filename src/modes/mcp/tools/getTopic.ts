import { readFile } from '../knowledgeBase.js';

export const getTopic = {
  definition: {
    name: 'get_topic',
    description:
      'Get documentation for a topic. Text enclosed in [[double brackets]] are cross-references — call this tool again with the name inside the brackets to retrieve linked documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic name as returned by list_topics' }
      },
      required: ['topic']
    }
  },
  handler: async (arguments_: Record<string, unknown>): Promise<string> => {
    const topic = (arguments_['topic'] as string).replace(/^\[\[(.+)]]$/, '$1');
    const candidates = topic.includes('/')
      ? [`${topic}.md`]
      : [`${topic}.md`, `${topic}/index.md`];
    for (const relativePath of candidates) {
      try {
        return await readFile(relativePath);
      } catch {
        // try next candidate
      }
    }
    return `Topic "${topic}" not found.`;
  }
};
