import { state } from './state.js';

interface QUnitTest {
  testId: string;
  testName: string;
  expected: null | number;
  assertions: Array<{ result: boolean; message: string }>;
  module: QUnitModule;
  skip?: true;
  todo?: boolean;
}

interface QUnitModule {
  name: string;
  tests: QUnitTest[];
  childModules: QUnitModule[];
  testsRun: number;
  testsIgnored: number;
  skip?: boolean;
  ignored?: boolean;
}



const m = {} as Module;
m.

const updateQUnitProgress = () => {
  let aggregatedTotal = 0;
  let aggregatedExecuted = 0;
  for (const module of QUnit.config.modules) {
    const { passed, failed, skipped, todo, total } = module.suiteReport.getTestCounts();
    aggregatedTotal += total - skipped - todo;
    aggregatedExecuted += module.testsRun;
    }
    ui5TestRunner.total = aggregatedTotal;
    ui5TestRunner.executed = aggregatedExecuted;
};

export const qunit = () => {
  state.type = 'QUnit';

        ui5TestRunner.type = 'QUnit';

        QUnit.begin(() => {
          ui5TestRunner.opa = isOpa();
        });

        QUnit.testStart(() => {
          updateQUnitProgress();
        });

        QUnit.testDone(() => {
          updateQUnitProgress();
        });

        QUnit.done(() => {
          updateQUnitProgress();
          ui5TestRunner.status = 'done';
        });
};
