import { Host } from './platform/index.js';
import type { IProcess } from './platform/index.js';
import { Npm } from './Npm.js';

const QUOTED_AND_UNQUOTED_TOKENS = /"[^"]*"|'[^']*'|[^ ]+/g;

export const parseCommand = (command: string): string[] =>
  command.matchAll(QUOTED_AND_UNQUOTED_TOKENS).map(([value]) => {
    if (value.startsWith('\'') && value.endsWith('\'')
        || value.startsWith('"') && value.endsWith('"')
       ) {
        return value.slice(1, value.length - 1);
    }
    return value;
  }).toArray();

type ExecuteOptions = {
  timeout?: number;
};

export const Command = {
  async execute(command: string, options: ExecuteOptions = {}): Promise<IProcess> {
    let executable = 'node'; // default
    const [commandSpecifier, ...parameters] = parseCommand(command);
    if (commandSpecifier === 'npm') {
      parameters.unshift(await Npm.getCliPath());
    } else if (commandSpecifier !== 'node') {
      // check if an existing NPM command exists ?
    }
    throw new Error('Not implemented');

  }
};
