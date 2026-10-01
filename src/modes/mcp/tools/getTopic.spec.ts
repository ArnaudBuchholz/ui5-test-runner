import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IEntity, IKnowledgeBaseIndex, IReverseRelation } from '../kbIndex.js';

const entity = (overrides: Partial<IEntity>): IEntity => ({
  id: 'a',
  '#type': 'concept',
  title: 'A',
  summary: 's',
  keywords: [],
  relations: {},
  sha: '0',
  path: 'a.md',
  body: '# A',
  ...overrides
});

const setupIndex = async (
  entities: IEntity[],
  reverse: Record<string, IReverseRelation[]> = {}
): Promise<(arguments_: Record<string, unknown>) => Promise<string>> => {
  vi.resetModules();
  const byId = new Map(entities.map((item) => [item.id, item]));
  const index: IKnowledgeBaseIndex = {
    catalog: [],
    getEntity: (id) => byId.get(id),
    getReverseRelations: (id) => reverse[id] ?? []
  };
  const knowledgeBase = await import('../knowledgeBase.js');
  vi.spyOn(knowledgeBase, 'getIndex').mockReturnValue(index);
  const topicModule = await import('./getTopic.js');
  return topicModule.toolDefinitionGetTopic.handler;
};

describe('get_topic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the entity body for a known id', async () => {
    const handler = await setupIndex([entity({ id: 'a', body: '# Heading\ntext' })]);
    const result = await handler({ id: 'a' });
    expect(result).toContain('# Heading\ntext');
  });

  it('returns a not-found message for an unknown id', async () => {
    const handler = await setupIndex([entity({ id: 'a' })]);
    const result = await handler({ id: 'missing' });
    expect(result).toBe('No topic found for id "missing".');
  });

  it('lists forward relation edges under Related topics', async () => {
    const handler = await setupIndex([
      entity({ id: 'options/coverage', relations: { affects: ['modes/test'] } }),
      entity({ id: 'modes/test', title: 'Test mode' })
    ]);
    const result = await handler({ id: 'options/coverage' });
    expect(result).toContain('- modes/test — Test mode (affects)');
  });

  it('lists reverse relation edges under Related topics', async () => {
    const handler = await setupIndex(
      [entity({ id: 'modes/test', title: 'Test mode' }), entity({ id: 'options/coverage', title: 'Coverage' })],
      { 'modes/test': [{ id: 'options/coverage', relation: 'affects' }] }
    );
    const result = await handler({ id: 'modes/test' });
    expect(result).toContain('- options/coverage — Coverage (affects ←)');
  });

  it('does not repeat an id present both forward and reverse', async () => {
    const handler = await setupIndex(
      [
        entity({ id: 'a', title: 'A', relations: { 'see-also': ['b'] } }),
        entity({ id: 'b', title: 'B', relations: { 'see-also': ['a'] } })
      ],
      { a: [{ id: 'b', relation: 'see-also' }] }
    );
    const result = await handler({ id: 'a' });
    expect(result.match(/- b — B/g)).toHaveLength(1);
  });

  it('omits the Related topics section when the entity has no edges', async () => {
    const handler = await setupIndex([entity({ id: 'a', body: 'plain' })]);
    const result = await handler({ id: 'a' });
    expect(result).toBe('plain');
  });

  it('omits breaking-in edges from Related topics', async () => {
    const handler = await setupIndex([entity({ id: 'a', body: 'plain', relations: { 'breaking-in': ['v6'] } })]);
    const result = await handler({ id: 'a' });
    expect(result).toBe('plain');
  });

  it('uses the raw id when a forward edge points at an unknown entity', async () => {
    const handler = await setupIndex([entity({ id: 'a', relations: { 'see-also': ['ghost'] } })]);
    const result = await handler({ id: 'a' });
    expect(result).toContain('- ghost (see-also)');
  });
});
