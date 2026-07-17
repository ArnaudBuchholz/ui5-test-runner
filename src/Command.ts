import { assert } from './platform/index.js';
import { Npm } from './Npm.js';
import type { Configuration } from './configuration/Configuration.js';

const QUOTED_AND_UNQUOTED_TOKENS = /"[^"]*"|'[^']*'|[^ ]+/g;

export const Command = {
  split(command: string): string[] {
    return command
      .matchAll(QUOTED_AND_UNQUOTED_TOKENS)
      .map(([value]) => {
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
          return value.slice(1, -1);
        }
        return value;
      })
      .toArray();
  },

  async parse(configuration: Configuration, command: string): Promise<[string, string[]]> {
    let executable = 'node'; // default
    const [commandSpecifier, ...parameters] = Command.split(command);
    assert(!!commandSpecifier);
    if (commandSpecifier === 'npm') {
      parameters.unshift(await Npm.getCliPath());
    } else if (commandSpecifier !== 'node') {
      executable = commandSpecifier;
    }
    return [
      executable,
      parameters.map((parameter) => {
        if (parameter.startsWith('{{') && parameter.endsWith('}}')) {
          const optionName = parameter.slice(2, -2) as keyof Configuration;
          assert(optionName in configuration, `Invalid command line substitution parameter: ${optionName}`);
          // eslint-disable-next-line @typescript-eslint/no-base-to-string -- {{placeholder}} substitution is only used with scalar options (string/number/boolean), never complex objects
          return configuration[optionName]?.toString() ?? '';
        }
        return parameter;
      })
    ];
  }
};
