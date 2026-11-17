import type { State } from '../../../reports/ui/types.js';
import type { CommonTestReport } from '../../../types/CommonTestReportFormat.js';
import { formatDuration } from '../utils/format.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { formatHostLabel } from '../../../utils/shared/host.js';
import type { HostInfo } from '../../../utils/shared/host.js';

function formatDate(timestamp: string | undefined): string {
  if (!timestamp) {
    return 'N/A';
  }
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function toolLabel(report: CommonTestReport): string {
  const { name, version } = report.results.tool;
  return version ? `${escapeHtml(name)}@${escapeHtml(version)}` : escapeHtml(name);
}

function browserLabel(report: CommonTestReport): string {
  const extra = report.results.environment?.extra;
  const name = extra?.['browserName'] as string | undefined;
  if (!name) {
    return '';
  }
  const version = extra?.['browserVersion'] as string | undefined;
  return version ? `${name} ${version}` : name;
}

function osLabel(report: CommonTestReport): string {
  const environment = report.results.environment;
  const machine = environment?.extra?.['machine'] as string | undefined;
  if (machine) {
    const cpus = (environment?.extra?.['cpus'] as HostInfo['cpus'] | undefined) ?? [];
    return formatHostLabel({ machine, cpus });
  }
  return environment?.osPlatform ?? '';
}

function metaItem(label: string, value: string): string {
  return value ? `<span>${label} <b>${escapeHtml(value)}</b></span>` : '';
}

export function renderHeader(state: State): string {
  const { report } = state;
  const isFailed = report.results.summary.failed > 0;
  const duration = report.results.summary.duration === undefined ? '' : formatDuration(report.results.summary.duration);

  return `<header class="hdr">
  <h1 class="hdr__title">UI5 Test Runner Report</h1>
  <span class="pill ${isFailed ? 'pill--fail' : 'pill--pass'}">
    <span>${isFailed ? '✗' : '✓'}</span>${isFailed ? 'Failed' : 'Passed'}
  </span>
  <div class="hdr__meta">
    ${metaItem('Tool', toolLabel(report))}
    ${metaItem('Date', formatDate(report.timestamp))}
    ${metaItem('Duration', duration)}
    ${metaItem('Browser', browserLabel(report))}
    ${metaItem('OS', osLabel(report))}
  </div>
  <div class="hdr__actions">
    <button id="themeBtn" class="btn btn--icon" title="Toggle light / dark">◐</button>
    <button id="openBtn" class="btn">Open…</button>
    <button id="exportBtn" class="btn">Export</button>
  </div>
</header>`;
}
