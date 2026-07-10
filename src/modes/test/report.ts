import { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';
import { version } from '../../platform/version.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { toPlainObject } from '../../utils/shared/object.js';
import { anonymize } from '../../utils/node/anonymize.js';

let _reportBuilder: TestReportBuilder | undefined;

export async function initReportBuilder(configuration: Configuration): Promise<void> {
  _reportBuilder = new TestReportBuilder(crypto.randomUUID(), await version());
  _reportBuilder.report.extra = {
    configuration: anonymize(toPlainObject(configuration))
  };
  // TODO: document report.results.environment[osPlatform, osRelease...]
}

export function getReportBuilder(): TestReportBuilder {
  if (_reportBuilder === undefined) throw new Error('reportBuilder not initialized');
  return _reportBuilder;
}
