declare global {
  interface Window {
    __coverage__?: unknown;
    suite?: () => void | Promise<void>;
    sap?: { ui?: { test?: { Opa5?: object } } };
  }
}
