import { Platform } from '../Platform.js';
import type { LogMessage } from './types.js';
import '../logger.js';
import type { Configuration } from '../configuration/Configuration.js';
import { LoggerOutputFactory } from './output/factory.js';

export const workerMain = ({ configuration }: { configuration: Configuration }) => {
  const loggerOutput = LoggerOutputFactory.build(configuration);

  const channel = Platform.createBroadcastChannel('logger');
  channel.onmessage = (event: { data: LogMessage }) => {
    const { data: message } = event;
    if (message.command === 'terminate') {
      channel.close();
      loggerOutput.closeLoggerOutput();
      /* istanbul ignore else */
    } else if (message.command === 'log') {
      loggerOutput.addAttributesToLoggerOutput(message);
    }
  };

  loggerOutput.addTextToLoggerOutput(`       _ ____        _            _                                         
 _   _(_) ___|      | |_ ___  ___| |_      _ __ _   _ _ __  _ __   ___ _ __ 
| | | | |___ \\ _____| __/ _ \\/ __| __|____| '__| | | | '_ \\| '_ \\ / _ \\ '__|
| |_| | |___) |_____| ||  __/\\__ \\ ||_____| |  | |_| | | | | | | |  __/ |   
 \\__,_|_|____/       \\__\\___||___/\\__|    |_|   \\__,_|_| |_|_| |_|\\___|_|   \n`);

  channel.postMessage({
    command: 'ready',
    source: 'output'
  } satisfies LogMessage);
};
