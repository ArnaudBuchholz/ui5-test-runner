import { Platform } from '../Platform.js';
import type { LogMessage } from './types.js';
import '../logger.js';
import type { Configuration } from '../configuration/Configuration.js';
import { LoggerOutputFactory } from './output/factory.js';

const fromHexaCode = (value: string): { r: number; g: number; b: number } => {
  const [, r, g, b] = /#([0-9A-F][0-9A-F])([0-9A-F][0-9A-F])([0-9A-F][0-9A-F])/.exec(value) ?? [0, '0', '0', '0'];
  return {
    r: Number.parseInt(r, 16),
    g: Number.parseInt(g, 16),
    b: Number.parseInt(b, 16)
  };
};

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

  // Spice up the logo with UI5 official colors
  const from = fromHexaCode('#FF5A37');
  const to = fromHexaCode('#FFA42C');
  const background = '\u001B[40m';
  const diff = {
    r: to.r - from.r,
    g: to.g - from.g,
    b: to.b - from.b
  };

  const rawLogo = String.raw`   _,     ,_           _ ____        _            _
 .'/  ,_   \'.   _   _(_) ___|      | |_ ___  ___| |_      _ __ _   _ _ __  _ __   ___ _ __
|  \__( >__/  | | | | | |___ \ _____| __/ _ \/ __| __|____| '__| | | | '_ \| '_ \ / _ \ '__|
\             / | |_| | |___) |_____| ||  __/\__ \ ||_____| |  | |_| | | | | | | |  __/ |
 '-.._____..-'   \__,_|_|____/       \__\___||___/\__|    |_|   \__,_|_| |_|_| |_|\___|_|`;
  const width = Math.max(...rawLogo.split('\n').map((line) => line.length));
  const logo = rawLogo
    .split('\n')
    .map(
      (line) =>
        background +
        [...line.padEnd(width, ' ')]
          .map((c, index) => {
            const r = Math.floor(from.r + (diff.r * index) / width);
            const g = Math.floor(from.g + (diff.g * index) / width);
            const b = Math.floor(from.b + (diff.b * index) / width);
            return `\u001B[38;2;${r};${g};${b}m` + c;
          })
          .join('') +
        '\u001B[0m'
    )
    .join('\n');

  loggerOutput.addTextToLoggerOutput(logo + '\u001B[0m\n');

  channel.postMessage({
    command: 'ready',
    source: 'output'
  } satisfies LogMessage);
};
