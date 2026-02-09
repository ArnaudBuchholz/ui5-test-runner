export interface QUnitTestAssertion {
  passed: boolean;
  message: string;
  stack?: string;
  todo: boolean;
}

export interface QUnitTestReport {
  name: string;
  skipped: boolean;
  todo: boolean;
  assertions: QUnitTestAssertion[];
  /** Relative to page load ms */
  _startTime?: number;
  /** Relative to page load ms */
  _endTime?: number;
}

export interface QUnitTest {
  testId: string;
  testName: string;
  expected: null | number;
  module: QUnitModule;
  skip?: true;
  todo?: boolean;
}

export interface QUnitSuiteReport {
  name: string;
  childSuites: QUnitSuiteReport[];
  tests: QUnitTestReport[];
  /** Relative to page load ms */
  _startTime?: number;
  /** Relative to page load ms */
  _endTime?: number;
}

export interface QUnitModule {
  name: string;
  tests: QUnitTest[];
  childModules: QUnitModule[];
  testsRun: number;
  testsIgnored: number;
  skip?: boolean;
  ignored?: boolean;
  suiteReport?: QUnitSuiteReport;
}

export interface QUnitConfig {
  modules: QUnitModule[];
}
