import { toolDefinitionListTopics } from './listTopics.js';
import { toolDefinitionGetTopic } from './getTopic.js';

export const TOOLS: Record<
  string,
  { definition: object; handler: (arguments_: Record<string, unknown>) => Promise<string> }
> = {
  list_topics: toolDefinitionListTopics,
  get_topic: toolDefinitionGetTopic
};
