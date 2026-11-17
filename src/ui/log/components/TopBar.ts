import type { LogMetrics } from '../../../modes/log/LogMetrics.js';
import type { Settings, State } from '../../../modes/log/ui/types.js';
import { formatBytes, formatDuration } from '../utils/format.js';
import { escapeHtml } from './EventDetails.js';

function selectOptions(options: ReadonlyArray<{ label: string; key: number }>, selected: number): string {
  return options
    .map((o) => `<option value="${o.key}"${o.key === selected ? ' selected' : ''}>${escapeHtml(o.label)}</option>`)
    .join('');
}

function status(metrics: LogMetrics): string {
  const isLive = metrics.reading;
  const span = metrics.maxTimestamp > metrics.minTimestamp ? metrics.maxTimestamp - metrics.minTimestamp : 0;
  return `<div class="ev-status">
    <span class="ev-dot ${isLive ? 'ev-dot-live' : 'ev-dot-replay'}"></span>
    <span class="ev-status-text">${isLive ? 'Live' : 'Replay'}</span>
    <span class="ev-stat"><b>${metrics.logCount}</b> events</span>
    <span class="ev-stat">${formatDuration(span)}</span>
    <span class="ev-stat">${formatBytes(metrics.inputSize)}</span>
  </div>`;
}

/**
Render the top bar: run status + stats on the left, the raw punyexpr filter input in the
middle, and time-range / autorefresh / sort-order controls on the right. The free-text
filter input value is the `freeExpression` (facet clauses live separately and are shown
as chips in the rail), so power users keep full punyexpr expressiveness.
*/
export function renderTopBar(
  state: State,
  settings: Settings,
  { freeExpression, order }: { freeExpression: string; order: 'asc' | 'desc' }
): string {
  const isRelative = state.timerangeType === 'relative';
  return `${status(state.metrics)}
  <div class="ev-filterbox">
    <input id="ev-filter" type="text" placeholder="filter expression, e.g. source === &quot;assert&quot; || message.includes(&quot;timeout&quot;)"
      value="${escapeHtml(freeExpression)}" spellcheck="false" autocomplete="off" />
    <button id="ev-filter-clear" title="Clear expression">⌫</button>
  </div>
  <div class="ev-controls">
    <label>time
      <select id="ev-timetype">
        <option value="relative"${isRelative ? ' selected' : ''}>relative</option>
        <option value="absolute"${isRelative ? '' : ' selected'}>absolute</option>
      </select>
    </label>
    <select id="ev-relative" ${isRelative ? '' : 'disabled'}>
      ${selectOptions(settings.relativeTimerange, state.relativeTimerange)}
    </select>
    <label>refresh
      <select id="ev-refresh">
        <option value="none"${state.autorefresh ? '' : ' selected'}>off</option>
        ${settings.autorefresh
          .map(
            (o) =>
              `<option value="${o.key}"${state.autorefresh && state.autorefreshInterval === o.key ? ' selected' : ''}>${escapeHtml(o.label)}</option>`
          )
          .join('')}
      </select>
    </label>
    <button id="ev-refresh-now" title="Refresh now">↻</button>
    <button id="ev-order" title="Toggle order">${order === 'desc' ? 'newest ↑' : 'oldest ↓'}</button>
  </div>`;
}
