import type { State } from '../../../reports/ui/types.js';
import type { CommonTestReport } from '../../../types/CommonTestReportFormat.js';
import { formatDuration } from '../utils/format.js';
import { formatHostLabel } from '../../../utils/shared/host.js';
import type { HostInfo } from '../../../utils/shared/host.js';

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function formatDate(timestamp: string | undefined): string {
  if (!timestamp) return 'N/A';
  const d = new Date(timestamp);
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
}

function toolLabel(report: CommonTestReport): string {
  const { name, version } = report.results.tool;
  return version ? `${escapeHtml(name)}@${escapeHtml(version)}` : escapeHtml(name);
}

export function renderSummary(state: State): string {
  const { report } = state;
  const { summary } = report.results;

  const hasOverallFailed = summary.failed > 0;
  const statusDesign = hasOverallFailed ? 'Negative' : 'Positive';
  const statusLabel = hasOverallFailed ? 'failed' : 'success';

  const date = formatDate(report.timestamp);
  const reportId = report.reportId ? escapeHtml(report.reportId) : 'N/A';
  const generatedBy = report.generatedBy ? escapeHtml(report.generatedBy) : 'N/A';
  const duration = summary.duration === undefined ? 'N/A' : formatDuration(summary.duration);

  const browserName = report.results.environment?.extra?.['browserName'] as string | undefined;
  const browserVersion = report.results.environment?.extra?.['browserVersion'] as string | undefined;
  const browserLabel = browserName && browserVersion ? `${browserName} ${browserVersion}` : (browserName ?? '');
  const browser = browserLabel ? escapeHtml(browserLabel) : 'N/A';

  const machine = report.results.environment?.extra?.['machine'] as string | undefined;
  const rawCpus = report.results.environment?.extra?.['cpus'] as HostInfo['cpus'] | undefined;
  const osLabel = machine
    ? escapeHtml(formatHostLabel({ machine, cpus: rawCpus ?? [] }))
    : // eslint-disable-next-line sonarjs/no-nested-conditional
      report.results.environment?.osPlatform
      ? escapeHtml(report.results.environment.osPlatform)
      : 'N/A';

  const otherCount = summary.pending + summary.other;
  const otherTag = otherCount > 0 ? `<ui5-tag design="None">${otherCount} other</ui5-tag>` : '';

  return `<ui5-panel id="summaryPanel" collapsed no-animation="true">
  <div slot="header" class="panel-header">
    <ui5-title level="H4">Summary</ui5-title>
    <div class="panel-header-actions">
      <ui5-button id="openBtn" design="Transparent">Open Report</ui5-button>
      <ui5-button id="exportBtn" design="Transparent">Export</ui5-button>
      <ui5-tag design="${statusDesign}">${statusLabel}</ui5-tag>
    </div>
  </div>
  <div class="summary-body">
    <div class="summary-grid">
      <ui5-label>Date</ui5-label>
      <ui5-label>Report ID</ui5-label>
      <ui5-label>Tool</ui5-label>
      <ui5-label>Duration</ui5-label>
      <span>${date}</span>
      <span>${reportId}</span>
      <span>${generatedBy}</span>
      <span>${duration}</span>
    </div>
    <div class="summary-grid summary-grid--2">
      <ui5-label>Browser</ui5-label>
      <ui5-label>OS</ui5-label>
      <span>${browser}</span>
      <span>${osLabel}</span>
    </div>
    <div>
      <ui5-label>Tests (${toolLabel(report)})</ui5-label>
      <div class="summary-tags">
        <span>${summary.tests} total</span>
        <ui5-tag design="Positive">${summary.passed} passed</ui5-tag>
        <ui5-tag design="Negative">${summary.failed} failed</ui5-tag>
        <ui5-tag design="Neutral">${summary.skipped} skipped</ui5-tag>
        ${otherTag}
      </div>
    </div>
  </div>
</ui5-panel>`;
}
