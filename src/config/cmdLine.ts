import type { IJobConfig } from '../interfaces/IJobConfig.js';

export const fromCmdLine = (cwd: string, argv: string[]): IJobConfig => {
  const config: IJobConfig = { cwd };

  return config;
};
