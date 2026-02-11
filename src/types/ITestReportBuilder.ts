import { CommonTestStatus } from "./CommonTestReportFormat";

export interface ITestResult {
  suiteIds?: string | [string, ...string[]];
  label: string;
  status: CommonTestStatus;
  duration: number;
};

export interface ITestReportBuilder {
  /** Start of the tests execution (should be called only once) */
  begin(): void;
  /** Suite declaration, must occur before it is used */
  suite(id: string, label: string): void;

  test(result: ITestResult): void;

  /** End of tests execution */
  end(): void;


};

/**
 * tool (name) (version)
 * begin
 *   -> start time measurement
 * suite (id) (name)
 * test (suite ids) (name) (result) (duration)
 * end
 *   -> generate duration
 */