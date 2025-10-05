import { stat, access } from 'node:fs/promises';

export interface IFileStat {
  stat: typeof stat
}

export interface IFileAccess {
  access: typeof access
}

export interface IPlatform extends IFileStat, IFileAccess {}

let platform: IPlatform | undefined;

export const getPlatformSingleton = (): IPlatform => {
  platform ??= {
    stat,
    access,
  };
  return platform;
}
