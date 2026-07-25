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

  substitute(configuration: Configuration, value: string, extras: Record<string, string> = {}): string {
    return value.replaceAll(/\{\{(\w+)\}\}/g, (_, optionName: string) => {
      if (optionName in extras) {
        return extras[optionName]!;
      }
      assert(optionName in configuration, `Invalid command line substitution parameter: ${optionName}`);
      // eslint-disable-next-line @typescript-eslint/no-base-to-string -- substitution is only used with scalar options (string/number/boolean), never complex objects
      return configuration[optionName as keyof Configuration]?.toString() ?? '';
    });
  },

  async parse(
    configuration: Configuration,
    command: string,
    extras: Record<string, string> = {}
  ): Promise<[string, string[], Record<string, string>]> {
    let executable = 'node'; // default
    const tokens = Command.split(command);
    const environment: Record<string, string> = {};
    while (tokens.length > 0 && /^\w+=/.test(tokens[0]!)) {
      const [key, ...rest] = tokens.shift()!.split('=');
      environment[key!] = Command.substitute(configuration, rest.join('='), extras);
    }
    const [commandSpecifier, ...parameters] = tokens;
    assert(!!commandSpecifier);
    if (commandSpecifier === 'npm') {
      parameters.unshift(await Npm.getCliPath());
    } else if (commandSpecifier !== 'node') {
      executable = commandSpecifier;
    }
    return [
      executable,
      parameters.map((parameter) => Command.substitute(configuration, parameter, extras)),
      environment
    ];
  }
};
