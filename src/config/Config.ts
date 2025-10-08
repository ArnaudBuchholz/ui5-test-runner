import type { InferOptionType, IOption } from './IOption.js';
import { OptionType } from './IOption.js';

export const options = [
  {
    name: 'cwd',
    short: 'c',
    description: 'Set working directory',
    type: OptionType.folder,
    default: process.cwd(),
    defaultLabel: 'current working directory'
  },
  {
    name: 'version',
    description: 'Shows version',
    type: OptionType.boolean
  },
  {
    name: 'help',
    description: 'Shows help',
    type: OptionType.boolean
  },
  {
    name: 'capabilities',
    description: 'Run browser tests',
    type: OptionType.boolean
  },
  {
    name: 'url',
    short: 'u',
    description: 'URL of the testsuite / page to test',
    type: OptionType.url,
    multiple: true
  },
  {
    name: 'config',
    description: 'Configuration file (relative to cwd)',
    type: OptionType.file,
    default: 'ui5-test-runner.json'
  },
  {
    name: 'port',
    short: 'p',
    description: 'Port to use (0 to use any free one)',
    type: OptionType.integer,
    default: 0
  },
  {
    name: 'reportDir',
    short: 'r',
    description: 'Directory to output test reports (relative to cwd)',
    type: OptionType.file,
    default: 'report'
  },
  {
    name: 'pageTimeout',
    short: 'pt',
    description:
      'Limit the page execution time, fails the page if it takes longer than the timeout (0 means no timeout)',
    type: OptionType.timeout
  },
  {
    name: 'failFast',
    short: 'f',
    description: 'Stop the execution after the first failing page',
    type: OptionType.boolean
  },
  {
    name: 'failOpaFast',
    short: 'fo',
    description: 'Stop the OPA page execution after the first failing test',
    type: OptionType.boolean
  },
  {
    name: 'keepAlive',
    short: 'k',
    description: 'Keep the server alive',
    type: OptionType.boolean
  },
  {
    name: 'logServer',
    short: 'l',
    description: 'Log inner server traces',
    type: OptionType.boolean
  },
  {
    name: 'parallel',
    short: 'p',
    description: 'Number of parallel tests executions',
    type: OptionType.integer,
    default: 2
  },
  {
    name: 'browser',
    short: 'b',
    description: 'Browser instantiation command (relative to cwd or use $/ for provided ones)',
    type: OptionType.file,
    default: '$/puppeteer.js'
  }
] as const;

type HasDefault<T> = T extends { default: unknown } ? true : false;
type ConfigType<T extends IOption> = T['multiple'] extends true
  ? InferOptionType<T['type']>[]
  : InferOptionType<T['type']>;
type ConfigKeys = (typeof options)[number]['name'];
type GetConfig<K extends ConfigKeys> = Extract<(typeof options)[number], { name: K }>;

export type Config = {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? K : never]: ConfigType<GetConfig<K>>;
} & {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? `${K}Set` : never]?: true;
} & {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? never : K]?: ConfigType<GetConfig<K>>;
};
