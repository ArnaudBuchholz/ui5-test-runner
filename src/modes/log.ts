import { Exit, FileSystem, ZLib } from '../system/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { uncompress, createCompressionContext } from '../logger/compress.js';

export const log = async (configuration: Configuration) => {
  const { log: logFileName } = configuration;
  if (!logFileName) {
    console.error('Invalid log filename');
    Exit.code = -1;
    return;
  }
  const logStats = await FileSystem.stat(logFileName);
  const gunzip = ZLib.createGunzip();
  const input = FileSystem.createReadStream(logFileName);
  const chunks: Buffer[] = [];
  input
    .pipe(gunzip)
    .on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    })
    .on('end', () => {
      const result = Buffer.concat(chunks).toString();
      const context = createCompressionContext();
      let outputSize = 0;
      for (const json of uncompress(context, result)) {
        const stringified = JSON.stringify(json);
        outputSize += stringified.length + 1;
        console.log(stringified);
      }
      const compressionRatio = Math.floor((10_000 * logStats.size) / outputSize) / 100;
      console.log(`From ${logStats.size} to ${outputSize} (${chunks.length} chunks), ratio: ${compressionRatio}%`);
    })
    .on('error', (error) => {
      console.error(error);
      Exit.code = -1;
    });
};
