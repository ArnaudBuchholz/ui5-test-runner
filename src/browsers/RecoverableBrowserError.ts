/**
 * Signals a browser operation failure that should fail only the current page.
 *
 * BrowserFactory logs and forwards this error so pageTask can add it to the
 * test report. All other browser-operation errors remain fatal.
 */
export class RecoverableBrowserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecoverableBrowserError';
  }
}
