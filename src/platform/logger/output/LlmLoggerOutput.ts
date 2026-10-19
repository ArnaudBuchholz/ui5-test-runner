import { Terminal } from '../../index.js';
import type { InternalLogAttributes } from '../types.js';
import { LogLevel } from '../types.js';
import { BaseLoggerOutput } from './BaseLoggerOutput.js';

/** Severity marker for warn and above; info/debug lines stay unmarked to keep the common case clean. */
const SEVERITY: Partial<Record<LogLevel, string>> = {
  [LogLevel.warn]: 'WARN ',
  [LogLevel.error]: 'ERROR ',
  [LogLevel.fatal]: 'FATAL '
} as const;

/**
 * Output tailored for Large Language Model consumption. Like {@link InteractiveLoggerOutput}, it lets
 * the base do its usual work — progress bookkeeping, source/level filtering, and writing the complete
 * `output.txt` — then decides for itself what reaches the terminal and how. It prints one compact line
 * per rendered event, `[source#pageId] <SEVERITY?>message`, with no ANSI, no elapsed timestamp and no
 * progress heartbeat; lifecycle lines (page open/close, status banners) are kept off the terminal
 * (they remain in `output.txt`). Counts, verdict and the trace file path arrive as ordinary `job` logs.
 */
export class LlmLoggerOutput extends BaseLoggerOutput {
  private _current: InternalLogAttributes | undefined;

  override terminalResized(): void {}
  override closeLoggerOutput(): void {}

  override addAttributesToLoggerOutput(attributes: InternalLogAttributes): void {
    // Let the base filter, keep progress bookkeeping and write output.txt. It calls
    // addTextToLoggerOutput below only for records that pass its render filter.
    this._current = attributes;
    super.addAttributesToLoggerOutput(attributes);
    this._current = undefined;
  }

  override addTextToLoggerOutput(): void {
    const attributes = this._current;
    if (!attributes) {
      return;
    }
    const { source, pageId, level, message, error } = attributes;
    const context = pageId === undefined ? source : `${source}#${pageId}`;
    const severity = SEVERITY[level] ?? '';
    const details = error ? ` ${(error as Error).name}: ${(error as Error).message}` : '';
    Terminal.write(`[${context}] ${severity}${message}${details}\n`);
  }
}
