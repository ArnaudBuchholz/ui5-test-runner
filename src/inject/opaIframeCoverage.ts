import { UI5_TEST_RUNNER } from './contants.js';

// Extend the Window interface to include __coverage__
declare global {
  interface Window {
    __coverage__?: any;
  }
}

const MODULE = `${UI5_TEST_RUNNER}/opa-iframe-coverage`;

if (!(MODULE in window)) {
  Object.defineProperty(window, MODULE, {
    value: true
  });
  const { top } = window;
  if (top !== null && (window !== top || window !== window.parent)) {
    Object.defineProperty(window, '__coverage__', {
      get() {
        return top.__coverage__;
      },
      set(value) {
        top.__coverage__ = value;
        return true;
      }
    });
  }
}
