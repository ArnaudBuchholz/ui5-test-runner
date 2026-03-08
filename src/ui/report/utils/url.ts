import type { State } from '../types.js';

export function saveStateToHash(state: State) {
  const parameters = new URLSearchParams();
  if (state.filters.suite) {
    parameters.set('suite', state.filters.suite);
  }
  if (state.filters.status) {
    parameters.set('status', state.filters.status);
  }
  if (state.filters.search) {
    parameters.set('q', state.filters.search);
  }
  if (state.sort.criteria) {
    parameters.set('sort', state.sort.criteria);
  }
  if (state.sort.order) {
    parameters.set('sort-order', state.sort.order);
  }

  const hash = parameters.toString();
  globalThis.history.pushState(null, '', hash ? `#${hash}` : globalThis.location.pathname);
}

export function loadStateFromHash(state: State) {
  const hash = globalThis.location.hash.slice(1);
  if (!hash) {
    return;
  }

  const parameters = new URLSearchParams(hash);
  const suite = parameters.get('suite');
  if (suite) {
    state.filters.suite = suite;
  }
  const status = parameters.get('status');
  if (status) {
    state.filters.status = status;
  }
  const search = parameters.get('q');
  if (search) {
    state.filters.search = search;
  }
  const sort = parameters.get('sort');
  if (sort === 'name' || sort === 'status' || sort === 'duration') {
    state.sort.criteria = sort;
  }
  const sortOrder = parameters.get('sort-order');
  if (sortOrder === 'asc' || sortOrder === 'desc') {
    state.sort.order = sortOrder;
  }
}
