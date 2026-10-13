import { getIndex } from '../knowledgeBase.js';
import type { IEntity, IKnowledgeBaseIndex } from '../knowledgeBase.js';

// Build the "Related topics" section from an entity's forward id-relation edges and the reverse edges
// pointing at it. Each related id appears once (forward label wins). `breaking-in` is omitted: its
// values are version tokens, not entity ids. Returns '' when there is nothing to relate.
const buildRelatedTopics = (entity: IEntity, index: IKnowledgeBaseIndex): string => {
  const seen = new Set<string>();
  const lines: string[] = [];
  const add = (id: string, relation: string): void => {
    if (seen.has(id) || id === entity.id) {
      return;
    }
    seen.add(id);
    const related = index.getEntity(id);
    const title = related === undefined ? id : `${id} — ${related.title}`;
    lines.push(`- ${title} (${relation})`);
  };
  for (const [relation, targets] of Object.entries(entity.relations)) {
    if (relation === 'breaking-in') {
      continue;
    }
    for (const target of targets) {
      add(target, relation);
    }
  }
  for (const { id, relation } of index.getReverseRelations(entity.id)) {
    add(id, `${relation} ←`);
  }
  return lines.length === 0 ? '' : `\n\n## Related topics\n\n${lines.join('\n')}\n`;
};

export const toolDefinitionGetTopic = {
  definition: {
    name: 'get_topic',
    description:
      'Fetch the authoritative ui5-test-runner documentation for one entity by its id (from list_topics, e.g. "options/coverage"). Use this to ground every answer about ui5-test-runner in the actual docs rather than prior knowledge. Returns the entity markdown plus a "Related topics" section listing linked entities worth retrieving next.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Entity id as returned by list_topics' }
      },
      required: ['id']
    }
  },
  handler: (arguments_: Record<string, unknown>): Promise<string> => {
    const id = arguments_['id'] as string;
    const index = getIndex();
    const entity = index.getEntity(id);
    const text =
      entity === undefined ? `No topic found for id "${id}".` : entity.body + buildRelatedTopics(entity, index);
    return Promise.resolve(text);
  }
};
