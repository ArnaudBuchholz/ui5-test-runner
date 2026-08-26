import type { Configuration } from '../../configuration/Configuration.js';

const getEffectiveTimeout = (itemTimeout = 0, globalTimeout = 0, startTime: number): number => {
  if (itemTimeout || globalTimeout) {
    if (globalTimeout) {
      const remainingGlobal = globalTimeout - (Date.now() - startTime);
      return itemTimeout ? Math.min(remainingGlobal, itemTimeout) : remainingGlobal;
    }
    return itemTimeout;
  }
  return 0;
};

export const getPageTimeout = (configuration: Configuration, startTime: number): number =>
  getEffectiveTimeout(configuration.pageTimeout, configuration.globalTimeout, startTime);

export const getBatchTimeout = (configuration: Configuration, startTime: number): number =>
  getEffectiveTimeout(configuration.batchTimeout, configuration.globalTimeout, startTime);

export const isGloballyTimedOut = (configuration: Configuration, startTime: number): boolean => {
  const { globalTimeout = 0 } = configuration;
  return globalTimeout > 0 && Date.now() - startTime > globalTimeout;
};
