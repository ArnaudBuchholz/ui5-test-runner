import { stripVTControlCharacters } from 'node:util';

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
}
