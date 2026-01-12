export class Core {


static readonly SIGINT_ANY = 0;
  static readonly SIGINT_LOGGER = 999;

  static registerSigIntHandler(callback: () => void | Promise<void>, type = this.SIGINT_ANY) {
    if (type === Platform.SIGINT_LOGGER) {
      _sigIntLoggerHandler = callback;
    } else {
      _sigIntHandlers.push(callback);
    }
  }

  static readonly onSigInt = async () => {
    if (__developmentMode) {
      console.log(`${ANSI_BLUE}[~]${ANSI_WHITE}${ANSI_RED}SIGINT${ANSI_WHITE} received`);
    }
    for (const handler of _sigIntHandlers) {
      try {
        await handler();
      } catch {
        // ignore
      }
    }
    if (_sigIntLoggerHandler) {
      try {
        await _sigIntLoggerHandler();
      } catch {
        // ignore
      }
    }
    process.exit(process.exitCode);
  };
}

const _sigIntHandlers: (() => void | Promise<void>)[] = [];
let _sigIntLoggerHandler: () => void | Promise<void> | undefined;

if (isMainThread) {
  process.on('SIGINT', () => {
    void Platform.onSigInt();
  });
}
  