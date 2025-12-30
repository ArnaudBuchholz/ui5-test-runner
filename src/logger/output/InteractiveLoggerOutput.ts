import { Platform } from '../../Platform.js';
import { BaseLoggerOutput } from './BaseLoggerOutput.js';
import type { Configuration } from '../../configuration/Configuration.js';
import {
  ANSI_BLUE,
  ANSI_CYAN,
  ANSI_ERASE_SCREEN,
  ANSI_ERASE_TO_BEGIN,
  ANSI_ERASE_TO_END,
  ANSI_GOTO_HOME,
  ANSI_HIDE_CURSOR,
  ANSI_MAGENTA,
  ANSI_REQUEST_CURSOR_POSITION,
  ANSI_SETCOLUMN,
  ANSI_SHOW_CURSOR,
  ANSI_UP,
  ANSI_WHITE,
  ANSI_YELLOW
} from '../../terminal/ansi.js';

const TICKS_INTERVAL = 250;
const TICKS_PICTURES = ['[|]', '[/]', '[-]', String.raw`[\]`];
const TICKS_COLORS = [ANSI_BLUE, ANSI_CYAN, ANSI_MAGENTA, ANSI_CYAN, ANSI_YELLOW, ANSI_CYAN];

export class InteractiveLoggerOutput extends BaseLoggerOutput {
  private _noColor: boolean;
  private _ticksInterval: ReturnType<typeof setInterval>;
  private _tick = 0;
  private _terminalWidth = 80;
  private _linesToErase: number = 0;
  private _texts: string[] = [];

  constructor(configuration: Configuration) {
    super(configuration);
    this._noColor = !!process.env['NO_COLOR'];
    Platform.writeOnTerminal(ANSI_HIDE_CURSOR);
    this._ticksInterval = setInterval(this.tick.bind(this), TICKS_INTERVAL);
  }

  private _clean() {
    Platform.writeOnTerminal(ANSI_SETCOLUMN(0));
    if (this._linesToErase) {
      Platform.writeOnTerminal(ANSI_UP(this._linesToErase));
      Platform.writeOnTerminal(ANSI_ERASE_TO_END);
    }
    this._linesToErase = 0;
  }

  override terminalResized(width: number) {
    this._clean();
    this._terminalWidth = width;
    this._progress();
  }

  override addTextToLoggerOutput(formatted: string, raw: string): void {
    this._texts.push(this._noColor ? raw : formatted);
  }

  private _progress () {
    Platform.writeOnTerminal(ANSI_REQUEST_CURSOR_POSITION);
    this._clean();
    for (const text of this._texts) {
      Platform.writeOnTerminal(text);
    }
    this._texts.length = 0;
    const keys = Object.keys(this.progressMap)
      .filter((key) => key !== '')
      .toSorted((a: string, b: string) => a.localeCompare(b));
    for (const key of keys) {
      const progressBar = this.progressMap[key]!; // key is coming from Object.keys
      const rendered = progressBar.render(this._terminalWidth - 4);
      Platform.writeOnTerminal('   ' + rendered + '\n');
      ++this._linesToErase;
    }
    Platform.writeOnTerminal(TICKS_COLORS[this._tick % TICKS_COLORS.length]!);
    Platform.writeOnTerminal(TICKS_PICTURES[this._tick % TICKS_PICTURES.length]!);
    Platform.writeOnTerminal(ANSI_WHITE);
    const progressBar = this.progressMap[''];
    const rendered = progressBar.render(this._terminalWidth - 4);
    Platform.writeOnTerminal(rendered + '\n');
    ++this._linesToErase;
  }

  tick(): void {
    ++this._tick;
    this._progress();
  }

  override closeLoggerOutput(): void {
    clearInterval(this._ticksInterval);
    Platform.writeOnTerminal(ANSI_SHOW_CURSOR);
  }
}
