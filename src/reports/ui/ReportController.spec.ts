import { it, expect /*, vi*/ } from 'vitest';
import { ReportController } from './ReportController.js';
import type { State } from './types.js';
import { createEmptyTestResults, SPEC_VERSION } from '../../types/CommonTestReportFormat.js';

it('has an empty initial state', () => {
  const controller = new ReportController();
  expect(controller.state).toStrictEqual<State>({
    report: {
      reportFormat: 'CTRF',
      specVersion: SPEC_VERSION,
      results: createEmptyTestResults()
    },
    suiteId: '',
    filterOnStatus: '',
    search: '',
    sortBy: '',
    sortAscending: true,
    mode: 'open',
    suites: [],
    tests: []
  });
});

// it('shows the report when set', () => {
//   const controller = new ReportController();
//   const update = vi.fn();
//   controller.connect(update);
//   controller.interaction({
//     report: {
//       reportFormat: 'CTRF',
//       specVersion: SPEC_VERSION,
//       results: {
//         summary: {

//         }
//       }
//     }
//   })
// })
