import type { CommonTestReport, CommonTestStatus } from '../../types/CommonTestReportFormat.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { IBatchItem } from './BatchItem.js';
import { initReportBuilder } from '../../reports/initReportBuilder.js';
import { anonymize } from '../../utils/node/anonymize.js';

const itemStatus = (item: IBatchItem): CommonTestStatus => {
  if (item.skipped) {
    return 'skipped';
  }
  return item.statusCode === 0 ? 'passed' : 'failed';
};

export const buildBatchReport = async (
  items: IBatchItem[],
  configuration: Configuration
): Promise<CommonTestReport> => {
  let start = Date.now();
  for (const item of items) {
    start = Math.min(item.start?.getTime() ?? start, start);
  }
  let stop = start;
  for (const item of items) {
    stop = Math.max(item.end?.getTime() ?? stop, stop);
  }

  const tests = items.map((item) => {
    const itemStart = item.start?.getTime() ?? start;
    const itemStop = item.end?.getTime() ?? stop;
    const status = itemStatus(item);
    return {
      name: item.label,
      status,
      duration: itemStop - itemStart,
      start: itemStart,
      stop: itemStop,
      filePath: anonymize(item).path
    };
  });

  const summary = {
    tests: tests.length,
    passed: tests.filter((test) => test.status === 'passed').length,
    failed: tests.filter((test) => test.status === 'failed').length,
    skipped: tests.filter((test) => test.status === 'skipped').length,
    pending: 0,
    other: 0,
    start,
    stop,
    duration: stop - start
  };

  const builder = await initReportBuilder(configuration);
  return { ...builder.report, results: { ...builder.report.results, summary, tests } };
};
