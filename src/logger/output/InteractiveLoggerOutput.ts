import { Platform } from '../../Platform.js';
import { AbstractLoggerOutput } from './AbstractLoggerOutput.js';
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

// const TICKS = ['|', '/', '-', '\\'];
// let interactiveIntervalId: ReturnType<typeof setInterval> | undefined;

export class InteractiveLoggerOutput extends AbstractLoggerOutput {
  private _noColor: boolean;
  private _ticksInterval: ReturnType<typeof setInterval>;
  private _tick: number;

  constructor(configuration: Configuration) {
    super(configuration);
    this._noColor = !!process.env['NO_COLOR'];
    Platform.writeOnTerminal(ANSI_HIDE_CURSOR);
    this._ticksInterval = setInterval(this.tick.bind(this), TICKS_INTERVAL);
    this._tick = 0;
  }

  addTextToLoggerOutput(formatted: string, raw: string): void {
    Platform.writeOnTerminal(this._noColor ? raw : formatted);
  }

  tick(): void {
    Platform.writeOnTerminal(ANSI_SAVE_POS_DEC);
    ++this._tick;
    Platform.writeOnTerminal(TICKS_COLORS[this._tick % TICKS_COLORS.length]!);
    Platform.writeOnTerminal(TICKS_PICTURES[this._tick % TICKS_PICTURES.length]!);
    Platform.writeOnTerminal(ANSI_WHITE);
    Platform.writeOnTerminal(ANSI_LOAD_POS_DEC);
  }

  override closeLoggerOutput(): void {
    clearInterval(this._ticksInterval);
    Platform.writeOnTerminal(ANSI_SHOW_CURSOR);
  }
}
