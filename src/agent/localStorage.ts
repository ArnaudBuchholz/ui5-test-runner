import { UI5_TEST_RUNNER } from './contants.js';

const throwOnStorageEvent = () => {
  throw new Error('[ui5-test-runner] localStorage.addEventListener is not supported in parallel mode');
};

export function patchLocalStorage(): void {
  if ((window[UI5_TEST_RUNNER]?.config?.parallel ?? 1) <= 1) return;

  const store = new Map<string, string>();

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
      addEventListener: throwOnStorageEvent,
      removeEventListener: throwOnStorageEvent
    }
  });
}
