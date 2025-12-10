import { assert } from '../assert.js';
import type { InternalLogAttributes } from '../logger/types.js';
import { LogLevel } from '../logger/types.js';

export class ProgressBar {
  static readonly WIDTH = 10;

  private _maxState: number = LogLevel.info;
  private _value = 0;
  private _max = 0;
  private _label = '';

  get label() {
    return this._label;
  }

  update(attributes: InternalLogAttributes) {
    assert(attributes.source === 'progress');
    this._value = attributes.data.value;
    this._max = attributes.data.max;
    if (attributes.level > this._maxState) {
      this._maxState = attributes.level;
    }
    this._label = attributes.message;
  }

  render(width: number) {
    let spaceLeft = width;
    let progressBar: string[] = [];
    if (this._max !== 0) {
      const ratio = this._value / this._max;
      const filled = Math.floor(ProgressBar.WIDTH * Math.min(ratio, 1));
      spaceLeft = width - ProgressBar.WIDTH - 7;
      progressBar = [
        '[',
        ''.padEnd(filled, '#'),
        ''.padEnd(ProgressBar.WIDTH - filled, '-'),
        ']',
        Math.floor(100 * ratio)
          .toString()
          .padStart(3, ' ')
          .toString(),
        '% '
      ];
    }
    const { length: labelLength } = this._label;
    const label =
      labelLength > spaceLeft ? `...${this._label.slice(Math.max(0, labelLength - spaceLeft + 3))}` : this._label;
    return [...progressBar, label].join('');
  }
}
