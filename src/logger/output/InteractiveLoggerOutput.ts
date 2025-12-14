import { Platform } from '../../Platform.js';
import { BaseLoggerOutput } from './BaseLoggerOutput.js';
import type { Configuration } from '../../configuration/Configuration.js';
import {
  ANSI_BLUE,
  ANSI_CYAN,
  ANSI_HIDE_CURSOR,
  ANSI_LOAD_POS_DEC,
  ANSI_MAGENTA,
  ANSI_SAVE_POS_DEC,
  ANSI_SHOW_CURSOR,
  ANSI_WHITE,
  ANSI_YELLOW
} from '../../terminal/ansi.js';

const TICKS_INTERVAL = 250;
const TICKS_PICTURES = ['[|]', '[/]', '[-]', String.raw`[\]`];
const TICKS_COLORS = [ANSI_BLUE, ANSI_CYAN, ANSI_MAGENTA, ANSI_CYAN, ANSI_YELLOW, ANSI_CYAN];

export class InteractiveLoggerOutput extends BaseLoggerOutput {
  private _noColor: boolean;
  private _ticksInterval: ReturnType<typeof setInterval>;
  private _tick: number;
  private _terminalWidth: number;

  constructor(configuration: Configuration) {
    super(configuration);
    this._noColor = !!process.env['NO_COLOR'];
    Platform.writeOnTerminal(ANSI_HIDE_CURSOR);
    this._ticksInterval = setInterval(this.tick.bind(this), TICKS_INTERVAL);
    this._tick = 0;
    this._terminalWidth = 80;
    Platform.writeOnTerminal(ANSI_SAVE_POS_DEC);
  }

  override terminalResized(width: number): void {
    // TODO: reset display
    this._terminalWidth = width;
  }

  override addTextToLoggerOutput(formatted: string, raw: string): void {
    Platform.writeOnTerminal(this._noColor ? raw : formatted);
    Platform.writeOnTerminal(ANSI_SAVE_POS_DEC);
  }

  tick(): void {
    Platform.writeOnTerminal(ANSI_LOAD_POS_DEC);
    ++this._tick;
    const keys = Object.keys(this.progressMap)
      .filter((key) => key !== '')
      .toSorted((a: string, b: string) => a.localeCompare(b));
    for (const key of keys) {
      const progressBar = this.progressMap[key]!; // key is coming from Object.keys
      const rendered = progressBar.render(this._terminalWidth);
      Platform.writeOnTerminal(rendered + '\n');
    }
    Platform.writeOnTerminal(TICKS_COLORS[this._tick % TICKS_COLORS.length]!);
    Platform.writeOnTerminal(TICKS_PICTURES[this._tick % TICKS_PICTURES.length]!);
    Platform.writeOnTerminal(ANSI_WHITE);
    const progressBar = this.progressMap[''];
    const rendered = progressBar.render(this._terminalWidth);
    Platform.writeOnTerminal(rendered.slice(3) + '\n');
  }

  override closeLoggerOutput(): void {
    clearInterval(this._ticksInterval);
    Platform.writeOnTerminal(ANSI_SHOW_CURSOR);
  }
}
