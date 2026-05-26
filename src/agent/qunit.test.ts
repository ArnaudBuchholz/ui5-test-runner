export const installQUnit = () => {
  const hooks: {
    begin?: Parameters<typeof QUnit.begin>[0];
    log?: Parameters<typeof QUnit.log>[0];
    testDone?: Parameters<typeof QUnit.testDone>[0];
    done?: Parameters<typeof QUnit.done>[0];
  } = {};

  window.QUnit = {
    begin(callback) {
      hooks.begin = callback;
    },
    log(callback) {
      hooks.log = callback;
    },
    testDone(callback) {
      hooks.testDone = callback;
    },
    done(callback) {
      hooks.done = callback;
    }
  } as QUnit;

  return hooks;
};
