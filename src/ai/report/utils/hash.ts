export type HashState = {
  filterOnSuiteUid: string;
  filterOnStatus: string;
  search: string;
  sortBy: string;
  sortAscending: boolean;
};

export function readHash(): Partial<HashState> {
  const hash = location.hash.slice(1);
  if (!hash) return {};
  const parameters = new URLSearchParams(hash);
  const result: Partial<HashState> = {};

  const suite = parameters.get('suite');
  if (suite !== null) result.filterOnSuiteUid = suite;

  const status = parameters.get('status');
  if (status !== null) result.filterOnStatus = status;

  const q = parameters.get('q');
  if (q !== null) result.search = q;

  const sort = parameters.get('sort');
  if (sort !== null) result.sortBy = sort;

  const sortOrder = parameters.get('sort-order');
  if (sortOrder !== null) result.sortAscending = sortOrder !== 'desc';

  return result;
}

export function writeHash(state: HashState): void {
  const parameters = new URLSearchParams();
  parameters.set('suite', state.filterOnSuiteUid);
  parameters.set('status', state.filterOnStatus);
  parameters.set('q', state.search);
  parameters.set('sort', state.sortBy);
  parameters.set('sort-order', state.sortAscending ? 'asc' : 'desc');
  history.pushState(null, '', `#${parameters.toString()}`);
}
