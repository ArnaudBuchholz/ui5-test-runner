import { Platform } from '../../Platform.js';
import { stripVTControlCharacters } from 'node:util';

export const appendToReport = (reportDirectory: string, text: string): void => {
  Platform.writeFileSync(Platform.join(reportDirectory, 'output.txt'), stripVTControlCharacters(text), {
    encoding: 'utf8',
    flag: 'a'
  });
};
