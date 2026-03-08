import type { State } from '../types.js';
import { formatDuration, formatTimestamp } from '../utils/ctrf.js';

export function renderSummary(state: State): string {
  const { report } = state;
  if (!report) return '';

  const { results, reportId, generatedBy, timestamp } = report;
  const { summary, tool } = results;

  const overallStatus = summary.failed > 0 ? 'Negative' : 'Positive';
  const overallStatusText = summary.failed > 0 ? 'failed' : 'passed';

  const toolName = tool.name + (tool.version ? `@${tool.version}` : '');
  const generatedByText = generatedBy || 'N/A';

  return `
        <ui5-panel id="summaryPanel" accessible-role="Complementary" collapsed="false">
            <div slot="header" class="header-title">
                <ui5-title level="H3">Test Report</ui5-title>
                <ui5-tag id="overallStatus" design="${overallStatus}">${overallStatusText}</ui5-tag>
            </div>
            
            <div class="header-panel-content">
                <div class="info-block">
                    <ui5-label>Date</ui5-label><br/>
                    <span>${formatTimestamp(timestamp)}</span>
                </div>
                <div class="info-block">
                    <ui5-label>Report ID</ui5-label><br/>
                    <span>${reportId || 'N/A'}</span>
                </div>
                <div class="info-block">
                    <ui5-label>Tool</ui5-label><br/>
                    <span>${generatedByText}</span>
                </div>
                <div class="info-block">
                    <ui5-label>Duration</ui5-label><br/>
                    <span>${formatDuration(summary.duration || 0)}</span>
                </div>
            </div>

            <div class="summary-section">
                <ui5-title level="H4">Tests (${toolName})</ui5-title>
                <div class="summary-counts">
                    <span>${summary.tests} total</span>
                    <ui5-tag design="Positive">${summary.passed} passed</ui5-tag>
                    <ui5-tag design="Negative">${summary.failed} failed</ui5-tag>
                    <ui5-tag design="Neutral">${summary.skipped} skipped</ui5-tag>
                    ${summary.other > 0 ? `<ui5-tag design="Neutral">${summary.other} other</ui5-tag>` : ''}
                </div>
            </div>
        </ui5-panel>
    `;
}
