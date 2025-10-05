import type { Config } from './Config.js';

export const fromCmdLine = (cwd: string, argv: string[]): Config => {
  const config: Config = { cwd };

  return config;
};
