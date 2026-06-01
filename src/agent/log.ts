import { agentLogPrefix } from '../types/AgentState.js';

export const log = (message: string) => console.debug(`${agentLogPrefix}${message}`);
log.error = (message: string) => console.error(`${agentLogPrefix}${message}`);
