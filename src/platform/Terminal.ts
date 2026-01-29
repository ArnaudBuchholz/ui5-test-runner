import { stripVTControlCharacters } from 'node:util';

const ASCII_ESCAPE = '\u001B';
const CSI = `${ASCII_ESCAPE}[`;

export class Terminal {
  static readonly isTTY = process.stdout.isTTY;
  static onResize(callback: (width: number) => void) {
    process.stdout.on('resize', () => callback(Terminal.width));
  }
  static setRawMode(callback: ((buffer: Buffer) => void) | false) {
    if (callback === false) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    } else {
      process.stdin.setRawMode(true);
      process.stdin.on('data', callback);
    }
  }
  static readonly stripVTControlCharacters = stripVTControlCharacters;
  static get width() {
    return process.stdout.columns;
  }
  static write(text: string) {
    process.stdout.write(text);
  }

  // see https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797

  static readonly HIDE_CURSOR = `${CSI}?25l`;
  static readonly SHOW_CURSOR = `${CSI}?25h`;
  static readonly SETCOLUMN = (column: number) => `${CSI}${column}G`;
  static readonly UP = (lines: number) => `${CSI}${lines}A`;
  static readonly ERASE_TO_END = `${CSI}0J`;

  static readonly BLUE = `${CSI}34m`;
  static readonly CYAN = `${CSI}36m`;
  static readonly GREEN = `${CSI}32m`;
  static readonly MAGENTA = `${CSI}35m`;
  static readonly RED = `${CSI}31m`;
  static readonly WHITE = `${CSI}37m`;
  static readonly YELLOW = `${CSI}33m`;
}
