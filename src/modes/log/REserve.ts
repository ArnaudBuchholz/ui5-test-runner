import type { Configuration } from 'reserve';
import type { ILogStorage } from './ILogStorage.js';
import type { LogMetrics } from './LogMetrics.js';

const getAsInt = (parameters: URLSearchParams, key: string): number | undefined => {
  const value = parameters.get(key);
  return value ? Number.parseInt(value) : undefined;
};

export const buildREserveConfiguration = (storage: ILogStorage, metrics: LogMetrics): Configuration => ({
  port: 0,
  mappings: [
    {
      custom: (request, response) => {
        response.setHeader('x-metrics-chunks-count', metrics.chunksCount.toString());
        response.setHeader('x-metrics-input-size', metrics.inputSize.toString());
        response.setHeader('x-metrics-output-size', metrics.outputSize.toString());
        response.setHeader('x-metrics-logs-count', storage.length.toString());
      }
    },
    {
      method: 'GET',
      match: '/query',
      custom: ({ url }) => {
        const searchParameters = new URLSearchParams(new URL(url!, 'http://localhost').search);
        const from = getAsInt(searchParameters, 'from');
        const to = getAsInt(searchParameters, 'to');
        const skip = getAsInt(searchParameters, 'skip');
        const limit = getAsInt(searchParameters, 'limit');
        const filter = searchParameters.get('filter') ?? undefined;
        return [storage.fetch({ from, to, skip, limit, filter })];
      }
    }
  ]
});
