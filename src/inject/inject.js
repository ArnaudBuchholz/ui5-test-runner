(function () {
  'use strict';

  const ui5TestRunner = {
    status: 'pending'
  };

  window['ui5-test-runner'] = ui5TestRunner;

  window.addEventListener('load', function () {
    if (typeof suite === 'function') {
      ui5TestRunner.type = 'suite';
    //   suite()
    //   post('addTestPages', { type: 'suite', pages })
    } else if (!QUnit) {
      ui5TestRunner.type = 'unknown';
    //   post('addTestPages', { type: 'none' })
    }
  });

}())
