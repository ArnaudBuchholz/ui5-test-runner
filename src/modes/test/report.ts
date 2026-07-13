import { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';
import { version } from '../../platform/version.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { toPlainObject } from '../../utils/shared/object.js';
import { anonymize } from '../../utils/node/anonymize.js';
import { assert, Host } from '../../platform/index.js';
import type { BrowserCapabilities } from '../../browsers/IBrowser.js';

let _reportBuilder: TestReportBuilder | undefined;

export async function initReportBuilder(configuration: Configuration): Promise<void> {
  const toolFullName = await version();
  const [toolName, toolVersion] = toolFullName.split('@');
  assert(toolName !== undefined);
  _reportBuilder = new TestReportBuilder(crypto.randomUUID(), toolFullName);
  _reportBuilder.report.results.tool = { name: toolName, version: toolVersion };
  _reportBuilder.report.extra = {
    configuration: anonymize(toPlainObject(configuration))
  };
  _reportBuilder.report.results.environment = {
    osPlatform: Host.platform(),
    osRelease: Host.osRelease(),
    osVersion: Host.osVersion(),
    extra: {
      machine: Host.machine(),
      cpus: Host.cpus()
    }
  };
}

export function getReportBuilder(): TestReportBuilder {
  if (_reportBuilder === undefined) throw new Error('reportBuilder not initialized');
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
