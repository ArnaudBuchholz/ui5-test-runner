import { agentLogPrefix } from '../types/AgentState.js';

/** Store console methods before they are hooked or replaced */

const _debug = console.debug.bind(console);
const _warn = console.warn.bind(console);
const _error = console.error.bind(console);

export const log = (message: string) => _debug(`${agentLogPrefix}${message}`);
log.warn = (message: string) => _warn(`${agentLogPrefix}${message}`);
log.error = (message: string) => _error(`${agentLogPrefix}${message}`);
