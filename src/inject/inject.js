(function () {
  'use strict';

  const { top } = window;
  if (top !== null && (window !== top || window !== window.parent)) {
    // iframe / sub window
  } else {
    //main window

    const ui5TestRunner = {
      status: 'pending'
    };

    window['ui5-test-runner'] = ui5TestRunner;

    window.addEventListener('load', function () {
      ui5TestRunner.loaded = Date.now();
      if (typeof suite === 'function') {
        ui5TestRunner.type = 'suite';
        //   suite()
        //   post('addTestPages', { type: 'suite', pages })
      } else if (typeof QUnit === 'undefined') {
        ui5TestRunner.type = 'unknown';
        //   post('addTestPages', { type: 'none' })
      } else {
        ui5TestRunner.type = 'QUnit';
      }
    });

    setInterval(() => {
      ui5TestRunner.ts = Date.now();
    }, 250);
  }

}());
