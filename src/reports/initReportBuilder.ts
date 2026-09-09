import { version } from '../platform/version.js';
import { Host } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { toPlainObject } from '../utils/shared/object.js';
import { anonymize } from '../utils/node/anonymize.js';
import { TestReportBuilder } from '../utils/shared/TestReportBuilder.js';

export async function initReportBuilder(configuration: Configuration): Promise<TestReportBuilder> {
  const { name: toolName, version: toolVersion } = await version();
  const builder = new TestReportBuilder(crypto.randomUUID(), `${toolName}@${toolVersion}`);
  builder.report.results.tool = { name: toolName, version: toolVersion };
  builder.report.results.environment = {
    osPlatform: Host.platform(),
    osRelease: Host.osRelease(),
    osVersion: Host.osVersion(),
    extra: { machine: Host.machine(), cpus: Host.cpus() }
  };
  builder.report.extra = { configuration: anonymize(toPlainObject(configuration)) };
  return builder;
}
