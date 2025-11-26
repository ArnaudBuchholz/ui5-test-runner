(function () {
  'use strict';

  const { top } = window;
  if (top !== null && (window !== top || window !== window.parent)) {
    // iframe / sub window
  } else {
    //main window

    function jsUnitTestSuite() {
      jsUnitTestSuite.pages = [];
    }

    jsUnitTestSuite.prototype.addTestPage = function (url) {
      jsUnitTestSuite.pages.push(url);
    }

    window.jsUnitTestSuite = jsUnitTestSuite

    const isOpa = () => {
      try {
        return !!window.sap.ui.test.Opa5;
      } catch (e) {
        return false;
      }
    };

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

    const ui5TestRunner = {
      status: 'pending'
    };

    window['ui5-test-runner'] = ui5TestRunner;

    window.addEventListener('load', async function () {
      ui5TestRunner.loaded = Date.now();
      if (typeof suite === 'function') {
        ui5TestRunner.type = 'suite';
        await suite();
        ui5TestRunner.pages = jsUnitTestSuite.pages ?? 'none';
        ui5TestRunner.status = 'done';
      } else if (typeof QUnit === 'undefined') {
        ui5TestRunner.type = 'unknown';
        //   post('addTestPages', { type: 'none' })
      } else {
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
      }
    });
  }

}());
