export const getEffectiveTimeout = (itemTimeout = 0, globalTimeout = 0, startTime: number): number => {
  if (itemTimeout || globalTimeout) {
    if (globalTimeout) {
      const remainingGlobal = globalTimeout - (Date.now() - startTime);
      return itemTimeout ? Math.min(remainingGlobal, itemTimeout) : remainingGlobal;
    }
    return itemTimeout;
  }
  return 0;
};

export const isGloballyTimedOut = (globalTimeout = 0, startTime: number): boolean =>
  globalTimeout > 0 && Date.now() - startTime > globalTimeout;
