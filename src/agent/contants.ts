export const UI5_TEST_RUNNER = 'ui5-test-runner' as const;
const { top } = window;
export const IN_IFRAME = top !== null && (window !== top || window !== window.parent);
