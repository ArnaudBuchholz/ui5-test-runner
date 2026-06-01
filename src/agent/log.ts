import { agentLogPrefix } from '../types/AgentState.js';

export const log = (message: string) => console.debug(`${agentLogPrefix}${message}`);
