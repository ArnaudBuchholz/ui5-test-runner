export type LogMetrics = {
  inputSize: number;
  chunksCount: number;
  outputSize: number;
  minTimestamp: number;
  maxTimestamp: number;
  logCount: number;
  reading: boolean;
};

export const getInitialLogMetrics = (): LogMetrics => ({
  inputSize: 0,
  chunksCount: 0,
  outputSize: 0,
  minTimestamp: Number.MAX_SAFE_INTEGER,
  maxTimestamp: 0,
  logCount: 0,
  reading: true
});
