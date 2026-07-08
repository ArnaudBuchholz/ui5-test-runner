import { assert, Process } from './platform/index.js';
import type { IProcess } from './platform/index.js';
import { Npm } from './Npm.js';
import { Configuration } from './configuration/Configuration.js';

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
  endTimeout?: number;
};

export const Command = {
  /** when options.endTimeout is used, execute will wait the maximum time but returns the process anyway: the caller is responsible for killing it if necessary */
  async execute(configuration: Configuration, command: string, options: ExecuteOptions = {}): Promise<IProcess> {
    let executable = 'node'; // default
    const [commandSpecifier, ...parameters] = parseCommand(command);
    assert(!!commandSpecifier);
    if (commandSpecifier === 'npm') {
      parameters.unshift(await Npm.getCliPath());
    } else if (commandSpecifier !== 'node') {
      executable = commandSpecifier;
    }
    parameters.push(configuration.reportDir);
    const process = Process.spawn(executable, parameters);
    if (!configuration.endTimeout) {
      return process;
    }
    const timeout = new Promise((resolve, reject) => setTimeout(() => reject(new Error('Command timed out')), configuration.endTimeout));
    await Promise.race([timeout, process.closed]);
    return process;
  }
};
