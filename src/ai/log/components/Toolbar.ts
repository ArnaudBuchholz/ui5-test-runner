import type { State, Settings } from '../../../modes/log/ui/types.js';

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toPickerValue(epoch: number): string {
  const d = new Date(epoch);
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function renderRelativeControls(state: State, settings: Settings): string {
  const rangeOptions = settings.relativeTimerange
    .map(
      (opt) =>
        `<ui5-option value="${opt.key}"${state.relativeTimerange === opt.key ? ' selected' : ''}>${opt.label}</ui5-option>`
    )
    .join('');

  const autorefreshIntervalOptions = settings.autorefresh
    .map(
      (opt) =>
        `<ui5-option value="${opt.key}"${state.autorefreshInterval === opt.key ? ' selected' : ''}>${opt.label}</ui5-option>`
    )
    .join('');

  const noneSelected = state.autorefresh ? '' : ' selected';

  return `<ui5-select id="relativeTimerangeSelect">${rangeOptions}</ui5-select>
  <span>Auto Refresh:</span>
  <ui5-select id="autorefreshSelect">
    <ui5-option value="none"${noneSelected}>None</ui5-option>
    ${autorefreshIntervalOptions}
  </ui5-select>`;
}

function renderAbsoluteControls(state: State): string {
  return `<ui5-datetime-picker id="absoluteFromPicker" value="${toPickerValue(state.absoluteTimerangeFrom)}" placeholder="From"></ui5-datetime-picker>
  <ui5-datetime-picker id="absoluteToPicker" value="${toPickerValue(state.absoluteTimerangeTo)}" placeholder="To"></ui5-datetime-picker>`;
}

export function renderToolbar(state: State, settings: Settings): string {
  const isRelative = state.timerangeType === 'relative';

  const timerangeControls = isRelative ? renderRelativeControls(state, settings) : renderAbsoluteControls(state);

  const errorStrip = state.errorMessage
    ? `<ui5-message-strip id="errorStrip" design="Negative" hide-close-button>${escapeHtml(state.errorMessage)}</ui5-message-strip>`
    : '';

  return `<ui5-input id="filterInput" value="${escapeHtml(state.filter)}" placeholder="Filter expression..." style="flex:1;min-width:200px;"></ui5-input>
  <ui5-select id="timerangeTypeSelect">
    <ui5-option value="relative"${isRelative ? ' selected' : ''}>Relative</ui5-option>
    <ui5-option value="absolute"${isRelative ? '' : ' selected'}>Absolute</ui5-option>
  </ui5-select>
  ${timerangeControls}
  <ui5-button id="refreshNowBtn">Refresh now</ui5-button>
  ${errorStrip}`;
}
