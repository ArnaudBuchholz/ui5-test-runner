import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ICatalogEntry, IKnowledgeBaseIndex } from '../kbIndex.js';

const setupCatalog = async (
  catalog: ICatalogEntry[]
): Promise<(arguments_: Record<string, unknown>) => Promise<string>> => {
  vi.resetModules();
  const index: IKnowledgeBaseIndex = {
    catalog,
    getEntity: () => {},
    getReverseRelations: () => []
  };
  const knowledgeBase = await import('../knowledgeBase.js');
  vi.spyOn(knowledgeBase, 'getIndex').mockReturnValue(index);
  const listTopicsModule = await import('./listTopics.js');
  return listTopicsModule.toolDefinitionListTopics.handler;
};

describe('list_topics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the catalog as JSON', async () => {
    const entry: ICatalogEntry = {
      id: 'options/coverage',
      '#type': 'option',
      title: 'coverage',
      summary: 'enable code coverage',
      relations: { affects: ['modes/test'] }
    };
    const handler = await setupCatalog([entry]);
    const result = await handler({});
    expect(JSON.parse(result)).toStrictEqual([entry]);
  });
});
