import { listTopics } from './listTopics.js';
import { getTopic } from './getTopic.js';
import { run } from './run.js';

export const TOOLS: Record<string, { definition: object; handler: (args: Record<string, unknown>) => Promise<string> }> = {
  list_topics: listTopics,
  get_topic: getTopic,
  run
};
