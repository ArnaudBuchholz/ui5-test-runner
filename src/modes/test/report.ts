import type { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { initReportBuilder as buildReportBuilder } from '../../reports/initReportBuilder.js';
import type { BrowserCapabilities } from '../../browsers/IBrowser.js';
import { assert } from '../../platform/index.js';

let _reportBuilder: TestReportBuilder | undefined;

export async function initReportBuilder(configuration: Configuration): Promise<void> {
  _reportBuilder = await buildReportBuilder(configuration);
}

export function getReportBuilder(): TestReportBuilder {
  assert(_reportBuilder !== undefined, 'reportBuilder not initialized');
  return _reportBuilder;
}

export function setReportBrowserInfo(capabilities: BrowserCapabilities): void {
  const environment = getReportBuilder().report.results.environment;
  if (environment) {
    environment.extra = {
      ...environment.extra,
      browserName: capabilities.browserName,
      browserVersion: capabilities.browserVersion
    };
  }
}
