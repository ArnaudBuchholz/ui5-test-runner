import { ReportController } from '../../../reports/ui/ReportController.js';
import type { State } from '../../../reports/ui/types.js';
import { createTestResults } from '../../../types/CommonTestReportFormat.js';
import type { CommonTestReport, CTRFTest } from '../../../types/CommonTestReportFormat.js';
import type { DeepPartial } from '../../../types/typeUtilities.js';

/**
Build a controller State from partial CTRF tests, running them through the real
ReportController so `state.tests` carry breadcrumbs and `state.suites` is the real
tree. Used by component specs to avoid hand-faking the BREADCRUMBS symbol.
*/
export function stateFromTests(
  tests: DeepPartial<CTRFTest>[],
  extra?: CommonTestReport['extra'],
  resultsExtra?: DeepPartial<CommonTestReport['results']>
): State {
  const results = createTestResults({ tool: { name: 'ui5-test-runner', version: '6.0.0' }, tests, ...resultsExtra });
  const report: CommonTestReport = {
    reportFormat: 'CTRF',
    specVersion: 'pre-1.0',
    reportId: 'fixture',
    timestamp: '2026-01-01T00:00:00.000Z',
    generatedBy: 'ui5-test-runner@6.0.0',
    extra,
    results
  };
  const controller = new ReportController();
  controller.connect(() => {});
  controller.interaction({ report });
  return controller.state;
}
