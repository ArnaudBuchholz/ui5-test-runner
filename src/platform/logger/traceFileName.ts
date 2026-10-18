/** Trace file name for a run, derived from its start time so every writer/reader agrees on it. */
export const traceFileName = (startedAt: number): string =>
  `traces-${new Date(startedAt).toISOString().slice(0, 19).replaceAll(/[-:]/g, '').replace('T', '-')}.logz`;
