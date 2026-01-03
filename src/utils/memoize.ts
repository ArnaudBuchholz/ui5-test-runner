/** Simple helper to compute value only once */
export const memoize = <T>(compute: () => T): (() => T) => {
  let cachedValue: T | undefined;
  let cachedError: unknown;
  return () => {
    if (cachedError) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Can be anything
      throw cachedError;
    }
    if (cachedValue === undefined) {
      try {
        cachedValue = compute();
      } catch (error) {
        cachedError = error;
        throw error;
      }
    }
    return cachedValue;
  };
};
