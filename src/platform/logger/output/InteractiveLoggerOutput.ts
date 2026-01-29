import { Terminal } from '../../index.js';
import { BaseLoggerOutput } from './BaseLoggerOutput.js';
import type { Configuration } from '../../../configuration/Configuration.js';

const TICKS_INTERVAL = 250;
const TICKS_PICTURES = ['[|]', '[/]', '[-]', String.raw`[\]`];
const TICKS_COLORS = [Terminal.BLUE, Terminal.CYAN, Terminal.MAGENTA, Terminal.CYAN, Terminal.YELLOW, Terminal.CYAN];

export class InteractiveLoggerOutput extends BaseLoggerOutput {
  private _noColor: boolean;
  private _ticksInterval: ReturnType<typeof setInterval>;
  private _tick = 0;
  private _terminalWidth = 80;
  private _linesToErase: number[] = [];
  private _texts: string[] = [];

  constructor(configuration: Configuration, startedAt: number) {
    super(configuration, startedAt);
    this._noColor = !!process.env['NO_COLOR'];
    Terminal.write(Terminal.HIDE_CURSOR);
    this._ticksInterval = setInterval(this.tick.bind(this), TICKS_INTERVAL);
  }

  private _clean() {
    Terminal.write(Terminal.SETCOLUMN(0));
    if (this._linesToErase.length > 0) {
      let count = 0;
      for (const width of this._linesToErase) {
        if (width > this._terminalWidth) {
          count += Math.ceil(width / this._terminalWidth);
        } else {
          ++count;
        }
      }
      Terminal.write(Terminal.UP(count));
      Terminal.write(Terminal.ERASE_TO_END);
    }
    this._linesToErase = [];
  }

  override terminalResized(width: number) {
    this._clean();
    this._terminalWidth = width;
    this._progress();
  }

  override addTextToLoggerOutput(formatted: string, raw: string): void {
    this._texts.push(this._noColor ? raw : formatted);
  }

  private _progress() {
    this._clean();
    for (const text of this._texts) {
      Terminal.write(text);
    }
    this._texts.length = 0;
    const keys = Object.keys(this.progressMap)
      .filter((key) => key !== '')
      .toSorted((a: string, b: string) => a.localeCompare(b));
    for (const key of keys) {
      const progressBar = this.progressMap[key]!; // key is coming from Object.keys
      const rendered = progressBar.render(this._terminalWidth - 4);
      Terminal.write('   ' + rendered + '\n');
      this._linesToErase.push(3 + rendered.length);
    }
    Terminal.write(TICKS_COLORS[this._tick % TICKS_COLORS.length]!);
    Terminal.write(TICKS_PICTURES[this._tick % TICKS_PICTURES.length]!);
    Terminal.write(Terminal.WHITE);
    const progressBar = this.progressMap[''];
    const rendered = progressBar.render(this._terminalWidth - 4);
    Terminal.write(rendered + '\n');
    this._linesToErase.push(3 + rendered.length);
  }

  tick(): void {
    ++this._tick;
    this._progress();
  }

  override closeLoggerOutput(): void {
    clearInterval(this._ticksInterval);
    this._progress();
    this._clean();
    Terminal.write(Terminal.SHOW_CURSOR);
  }
}
