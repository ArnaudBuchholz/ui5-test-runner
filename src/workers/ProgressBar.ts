import { ANSI_ELLIPSIS, ANSI_FULL_BLOCK, ANSI_LIGHT_SHADE } from '../ansi.js';
import { assert } from '../assert.js';
import type { InternalLogAttributes, LogAttributes } from '../loggerTypes.js';
import { LogLevel } from '../loggerTypes.js';

export class ProgressBar {
  static readonly WIDTH = 10;
  static readonly list: ProgressBar[] = [];

  private _uid: string;

  get uid() {
    return this._uid;
  }

  constructor(uid: string) {
    this._uid = uid;
    ProgressBar.list.push(this);
  }

  private _maxState: number = LogLevel.info;
  private _value = 0;
  private _max = 0;
  private _label = '';

  update(attributes: InternalLogAttributes & LogAttributes) {
    assert(attributes.source === 'progress');
    this._value = attributes.data.value;
    this._max = attributes.data.max;
    if (attributes.level > this._maxState) {
      this._maxState = attributes.level;
    }
    this._label = attributes.message;
  }

  render(width: number) {
    const ratio = this._max === 0 ? 0 : this._value / this._max;
    const filled = Math.floor(ProgressBar.WIDTH * Math.min(ratio, 1));
    const spaceLeft = width - ProgressBar.WIDTH - 13;
    const { length: labelLength } = this._label;
    const label =
      labelLength > spaceLeft
        ? `${ANSI_ELLIPSIS}${this._label.slice(Math.max(0, labelLength - spaceLeft - 1))}`
        : this._label;
    return [
      ''.padEnd(filled, ANSI_FULL_BLOCK),
      ''.padEnd(ProgressBar.WIDTH - filled, ANSI_LIGHT_SHADE),
      Math.floor(100 * ratio)
        .toString()
        .padStart(3, ' ')
        .toString(),
      '% ',
      label
    ].join('');
  }

  remove() {
    const pos = ProgressBar.list.indexOf(this);
    ProgressBar.list.splice(pos, 1);
  }
}
