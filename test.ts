import type { Configuration } from './src/configuration/Configuration.ts';
import type { InternalLogAttributes } from './src/logger/types.ts';
import { LogLevel } from './src/logger/types.ts';
import { InteractiveLoggerOutput } from './src/logger/output/InteractiveLoggerOutput.ts';
import { Platform } from './src/Platform.ts';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

const output = new InteractiveLoggerOutput({ reportDir: './tmp' } as Configuration);

process.on('exit', () => {
  output.closeLoggerOutput();
});

Platform.onTerminalResize(() => {
  output.terminalResized(Platform.terminalWidth);
});

await sleep(500);
output.addAttributesToLoggerOutput({
  level: LogLevel.info,
  source: 'progress',
  message: 'Execute',
  data: {
    uid: '',
    max: 0,
    value: 0
  }
} as InternalLogAttributes)
let tick = 0;
while (true) {
  ++tick;
  await sleep(250);
    output.addAttributesToLoggerOutput({
    level: LogLevel.info,
    source: 'progress',
    message: 'This is supposed to be a very long text to assess how resizing works',
    data: {
        uid: 'page1',
        max: 10,
        value: tick % 10
    }
  } as InternalLogAttributes)
}
