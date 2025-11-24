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
        // detect if OPA
        
      }
    });

    setInterval(() => {
      ui5TestRunner.ts = Date.now();
    }, 250);
  }

}());
