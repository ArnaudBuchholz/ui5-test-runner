import type { CommonTestStatus } from './CommonTestReportFormat';

export interface ITestResult {
  suite?: string | [string, ...string[]];
  label: string;
  status: CommonTestStatus;
  duration: number;
}

export interface ITestResultsBuilder {
  /** Start of the tests execution (should be called only once) */
  begin(tool: string): void;
  /** Add a test result */
  test(result: ITestResult): void;
  /** End of tests execution */
  end(): void;
}
