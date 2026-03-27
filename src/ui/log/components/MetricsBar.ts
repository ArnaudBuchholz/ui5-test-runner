import type { QueryMetrics } from '../types.js';
import { formatFileSize } from '../timeRange.js';

export function renderMetricsBar(metrics: QueryMetrics | null): string {
  if (!metrics) {
    return `<div class="metrics-bar metrics-bar--empty"><ui5-label>No metrics available</ui5-label></div>`;
  }

  return `
    <div class="metrics-bar">
      <ui5-label class="metrics-bar__title">Metrics from response headers</ui5-label>
      <div class="metrics-bar__items">
        <span class="metrics-bar__item">chunks: <strong>${metrics.chunksCount}</strong></span>
        <span class="metrics-bar__item">compressed: <strong>${formatFileSize(metrics.inputSize)}</strong></span>
        <span class="metrics-bar__item">decompressed: <strong>${formatFileSize(metrics.outputSize)}</strong></span>
        <span class="metrics-bar__item">total logs in file: <strong>${metrics.logsCount.toLocaleString()}</strong></span>
      </div>
    </div>
  `;
}
