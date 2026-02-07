declare global {
  interface Window {
    __coverage__?: unknown;
    suite?: () => void | Promise<void>;
  }
}

export {};
