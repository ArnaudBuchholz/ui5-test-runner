import { UI5_TEST_RUNNER } from './contants.js';

const throwOnStorageEvent = () => {
  throw new Error('[ui5-test-runner] localStorage.addEventListener is not supported in parallel mode');
};

export function patchLocalStorage(): void {
  const config = window[UI5_TEST_RUNNER]?.config;
  // The shim only exists to isolate per-page localStorage when several pages share one
  // browser context. It is unnecessary — and would hide the real storage — when pages run
  // serially (parallel <= 1) or when each page already has its own browser context
  // (isolation other than 'none'). Both keys are always present when config is (browser-exposed).
  if (!config || config.parallel <= 1 || config.isolation !== 'none') return;

  const store = new Map<string, string>();

  // Inherit from Storage.prototype so code guarded by `localStorage instanceof Storage` still works.
  const shim = Object.create(Storage.prototype) as Storage & {
    addEventListener: typeof throwOnStorageEvent;
    removeEventListener: typeof throwOnStorageEvent;
  };
  Object.assign(shim, {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    addEventListener: throwOnStorageEvent,
    removeEventListener: throwOnStorageEvent
  });
  Object.defineProperty(shim, 'length', {
    get: () => store.size
  });

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: shim
  });
}
