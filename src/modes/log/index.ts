import { __developmentMode, Exit, Terminal } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { LogReader } from './LogReader.js';

export const log = async (configuration: Configuration) => {
  const logFileName = configuration.log!; // Validated by configuration
  let stopped = false;
  Exit.registerAsyncTask({
    name: 'log',
    stop: () => {
      stopped = true;
    }
  });
  for await (const item of LogReader.read(logFileName)) {
    if (stopped) {
      break;
    }
    const { type, ...attributes } = item;
    if (type === 'log') {
      console.log(JSON.stringify(attributes));
    } else if (__developmentMode) {
      const { sourcePos, outputSize, chunksCount } = item;
      const compressionRatio = Math.floor((10_000 * sourcePos) / outputSize) / 100;
      console.error(
        `${Terminal.BLUE}[~]${Terminal.WHITE}From @${sourcePos} to ${outputSize} (${chunksCount} chunks), ratio: ${compressionRatio}%`
      );
    }
  }
};
