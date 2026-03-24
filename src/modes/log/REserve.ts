import type { Configuration } from 'reserve';
import type { ILogStorage } from './ILogStorage.js';

export const buildConfiguration = (storage: ILogStorage): Configuration => ({
  mappings: [
    {
      method: 'GET',
      match: 'query',
      custom: ({ url }) => {
        const searchParameters = new URLSearchParams(new URL(url!, 'http://localhost').search);
        const fromParameter = searchParameters.get('from');
        const from = fromParameter ? Number.parseInt(fromParameter) : undefined;
        const toParameter = searchParameters.get('to');
        const to = toParameter ? Number.parseInt(toParameter) : undefined;
        const skipParameter = searchParameters.get('skip');
        const skip = skipParameter ? Number.parseInt(skipParameter) : undefined;
        const limitParameter = searchParameters.get('limit');
        const limit = limitParameter ? Number.parseInt(limitParameter) : undefined;
        const filter = searchParameters.get('filter') ?? undefined;
        return [storage.fetch({ from, to, skip, limit, filter })];
      }
    }
  ]
});
