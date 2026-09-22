import { Path } from '../../../platform/index.js';
import { readFile } from '../knowledgeBase.js';
import { hashFolder, getReverseIndex } from '../folderHash.js';

const rewriteLinks = (body: string, hash: string): string =>
  body.replaceAll(/\]\(([^)]+)\)/g, (match, target: string) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/') || target.startsWith('#')) {
      return match;
    }
    if (target.includes('?')) {
      return match;
    }
    const hashIndex = target.indexOf('#');
    return hashIndex === -1
      ? `](${target}?${hash})`
      : `](${target.slice(0, hashIndex)}?${hash}${target.slice(hashIndex)})`;
  });

const buildCandidates = async (topic: string): Promise<string[]> => {
  const questionIndex = topic.indexOf('?');
  if (questionIndex === -1) {
    return topic.includes('/') ? [`${topic}.md`] : [`${topic}.md`, `${topic}/index.md`];
  }
  const relativePath = topic.slice(0, questionIndex);
  const anchorIndex = topic.indexOf('#');
  const hash = anchorIndex === -1 ? topic.slice(questionIndex + 1) : topic.slice(questionIndex + 1, anchorIndex);
  const reverseIndex = await getReverseIndex();
  const folder = reverseIndex.get(hash);
  if (folder === undefined) {
    return [];
  }
  const resolved = Path.join(folder, relativePath);
  if (resolved.startsWith('..')) {
    return [];
  }
  return resolved.endsWith('.md') ? [resolved] : [`${resolved}.md`, `${resolved}/index.md`];
};

export const toolDefinitionGetTopic = {
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
    const rawTopic = (arguments_['topic'] as string).replace(/^\[\[(.+)]]$/, '$1');
    const anchorStart = rawTopic.indexOf('#');
    const anchorStripped = anchorStart === -1 ? rawTopic : rawTopic.slice(0, anchorStart);
    const candidates = await buildCandidates(anchorStripped);
    for (const relativePath of candidates) {
      try {
        const body = await readFile(relativePath);
        const folder = Path.dirname(relativePath).replace(/^\./, '');
        const hash = hashFolder(folder);
        return rewriteLinks(body, hash);
      } catch {
        // try next candidate
      }
    }
    return `Topic "${rawTopic}" not found.`;
  }
};
