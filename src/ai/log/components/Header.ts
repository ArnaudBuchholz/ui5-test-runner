import type { LogMetrics } from '../../../modes/log/LogMetrics.js';

export function renderHeader(metrics: LogMetrics): string {
  const isLive = metrics.reading;
  const statusText = isLive ? 'Live' : 'Replay';
  const statusDesign = isLive ? 'Positive' : 'Neutral';
  return `<div id="header">
  <h1>UI5 Test Runner Log Viewer</h1>
  <ui5-button id="statusBtn" design="${statusDesign}">Status: ${statusText}</ui5-button>
</div>`;
}
