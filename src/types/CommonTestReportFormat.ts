// Based on https://ctrf.io, see https://github.com/ctrf-io/ctrf/blob/main/spec/ctrf.md
// JSON schema converted through https://transform.tools/json-schema-to-typescript

export type CommonTestStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'other';

/** Common Test Report Format - an open standard JSON format for test results reports */
export interface CommonTestReport {
  /** Document format identifier. Must be 'CTRF' */
  reportFormat: 'CTRF';
  /** CTRF specification version in SemVer format (MAJOR.MINOR.PATCH) */
  specVersion: 'pre-1.0';
  /** Unique identifier for this report instance (UUID) */
  reportId?: string;
  /** Report generation time (RFC 3339 / ISO 8601) */
  timestamp?: string;
  /** Tool or system that produced this CTRF document */
  generatedBy?: string;
  /** Extension point for arbitrary metadata */
  extra?: {
    [k: string]: unknown;
  };
  /** Results of a single test execution run */
  results: {
    /** Tool or framework that produced the test results */
    tool: {
      /** Name of the testing tool or framework */
      name: string;
      /** Version of the testing tool */
      version?: string;
      /** Extension point for arbitrary metadata */
      extra?: {
        [k: string]: unknown;
      };
    };
    /** Aggregated statistics and timing for the test run */
    summary: {
      /** Total number of tests executed */
      tests: number;
      /** Count of tests with status 'passed' */
      passed: number;
      /** Count of tests with status 'failed' */
      failed: number;
      /** Count of tests with status 'skipped' */
      skipped: number;
      /** Count of tests with status 'pending' */
      pending: number;
      /** Count of tests with status 'other' */
      other: number;
      /** Count of flaky tests (passed after failed attempts) */
      flaky?: number;
      /** Number of test suites in the run */
      suites?: number;
      /** Run start time (milliseconds since Unix epoch) */
      start: number;
      /** Run end time (milliseconds since Unix epoch) */
      stop: number;
      /** Total run duration (milliseconds) */
      duration?: number;
      /** Extension point for arbitrary metadata */
      extra?: {
        [k: string]: unknown;
      };
    };
    /** List of test cases executed during the run */
    tests: {
      /** Unique, stable identifier for the test case (UUID) */
      id?: string;
      /** Name or title of the test case */
      name: string;
      /** Final outcome of the test case */
      status: CommonTestStatus;
      /** Test execution time (milliseconds) */
      duration: number;
      /** Test start time (milliseconds since Unix epoch) */
      start?: number;
      /** Test end time (milliseconds since Unix epoch) */
      stop?: number;
      /** Suite hierarchy from top-level to immediate parent */
      suite?: readonly [string, ...string[]];
      /** Error or failure message */
      message?: string;
      /** Stack trace or failure trace information */
      trace?: string;
      /** Code snippet associated with the failure */
      snippet?: string;
      /** AI-generated diagnostic data or suggestions */
      ai?: string;
      /** Line number of the test definition */
      line?: number;
      /** Original status from source tool before normalization */
      rawStatus?: string;
      /** User-defined tags */
      tags?: string[];
      /** Test classification (e.g., 'unit', 'integration', 'e2e') */
      type?: string;
      /** Path to the file defining this test */
      filePath?: string;
      /** Number of retry attempts performed */
      retries?: number;
      /** List of retry attempts for this test */
      retryAttempts?: {
        /** Attempt number (1 = first execution) */
        attempt: number;
        /** Outcome of this attempt */
        status: CommonTestStatus;
        /** Attempt execution time (milliseconds) */
        duration?: number;
        /** Error or failure message for this attempt */
        message?: string;
        /** Stack trace for this attempt */
        trace?: string;
        /** Line number associated with failure */
        line?: number;
        /** Code snippet for this attempt */
        snippet?: string;
        /** Standard output lines from this attempt */
        stdout?: string[];
        /** Standard error lines from this attempt */
        stderr?: string[];
        /** Attempt start time (milliseconds since Unix epoch) */
        start?: number;
        /** Attempt end time (milliseconds since Unix epoch) */
        stop?: number;
        /** Artifacts from this attempt */
        attachments?: {
          /** Display name of the attachment */
          name: string;
          /** MIME type of the attachment */
          contentType: string;
          /** Path or URI to the attachment */
          path: string;
          /** Extension point for arbitrary metadata */
          extra?: {
            [k: string]: unknown;
          };
        }[];
        /** Extension point for arbitrary metadata */
        extra?: {
          [k: string]: unknown;
        };
      }[];
      /** True if test passed after one or more failed attempts */
      flaky?: boolean;
      /** Standard output lines from test execution */
      stdout?: string[];
      /** Standard error lines from test execution */
      stderr?: string[];
      /** Thread or worker identifier */
      threadId?: string;
      /** Browser used for browser-based tests */
      browser?: string;
      /** Device or device profile used */
      device?: string;
      /** Single base64-encoded screenshot image */
      screenshot?: string;
      /** Additional artifacts (screenshots, logs, videos, etc.) */
      attachments?: {
        /** Display name of the attachment */
        name: string;
        /** MIME type of the attachment */
        contentType: string;
        /** Path or URI to the attachment */
        path: string;
        /** Extension point for arbitrary metadata */
        extra?: {
          [k: string]: unknown;
        };
      }[];
      /** Test parameters or input values */
      parameters?: {
        [k: string]: unknown;
      };
      /** Test steps or sub-operations */
      steps?: {
        /** Name of the step */
        name: string;
        /** Outcome of the step */
        status: CommonTestStatus;
        /** Extension point for arbitrary metadata */
        extra?: {
          [k: string]: unknown;
        };
      }[];
      /** Derived metrics for this test across runs */
      insights?: {
        /** Pass rate metric with baseline comparison */
        passRate?: {
          /** Current metric value */
          current?: number;
          /** Baseline metric value for comparison */
          baseline?: number;
          /** Computed difference between current and baseline */
          change?: number;
        };
        /** Fail rate metric with baseline comparison */
        failRate?: {
          /** Current metric value */
          current?: number;
          /** Baseline metric value for comparison */
          baseline?: number;
          /** Computed difference between current and baseline */
          change?: number;
        };
        /** Flaky rate metric with baseline comparison */
        flakyRate?: {
          /** Current metric value */
          current?: number;
          /** Baseline metric value for comparison */
          baseline?: number;
          /** Computed difference between current and baseline */
          change?: number;
        };
        /** Average duration metric with baseline comparison */
        averageTestDuration?: {
          /** Current metric value */
          current?: number;
          /** Baseline metric value for comparison */
          baseline?: number;
          /** Computed difference between current and baseline */
          change?: number;
        };
        /** 95th percentile duration with baseline comparison */
        p95TestDuration?: {
          /** Current metric value */
          current?: number;
          /** Baseline metric value for comparison */
          baseline?: number;
          /** Computed difference between current and baseline */
          change?: number;
        };
        /** Number of runs this test was executed in */
        executedInRuns?: number;
        /** Extension point for arbitrary metadata */
        extra?: {
          [k: string]: unknown;
        };
      };
      /** Extension point for arbitrary metadata */
      extra?: {
        [k: string]: unknown;
      };
    }[];
    /** Execution environment, system configuration, and build context */
    environment?: {
      /** Human-readable name for this report */
      reportName?: string;
      /** Name of the application under test */
      appName?: string;
      /** Version of the application under test */
      appVersion?: string;
      /** Unique identifier for the CI/CD build */
      buildId?: string;
      /** Name of the CI/CD build or pipeline */
      buildName?: string;
      /** Sequential build number */
      buildNumber?: number;
      /** URL to the CI/CD build */
      buildUrl?: string;
      /** Name of the source code repository */
      repositoryName?: string;
      /** URL of the source code repository */
      repositoryUrl?: string;
      /** Git commit SHA or VCS revision identifier */
      commit?: string;
      /** Git branch or VCS branch name */
      branchName?: string;
      /** Operating system platform (e.g., 'linux', 'darwin', 'win32') */
      osPlatform?: string;
      /** Operating system release version */
      osRelease?: string;
      /** Operating system version string */
      osVersion?: string;
      /** Logical test environment (e.g., 'staging', 'production') */
      testEnvironment?: string;
      /** Indicates if the run is considered healthy */
      healthy?: boolean;
      /** Extension point for arbitrary metadata */
      extra?: {
        [k: string]: unknown;
      };
    };
    /** Extension point for arbitrary metadata */
    extra?: {
      [k: string]: unknown;
    };
  };
  /** Aggregated metrics computed across multiple test runs */
  insights?: {
    /** Overall pass rate with baseline comparison */
    passRate?: {
      /** Current metric value */
      current?: number;
      /** Baseline metric value for comparison */
      baseline?: number;
      /** Computed difference between current and baseline */
      change?: number;
    };
    /** Overall fail rate with baseline comparison */
    failRate?: {
      /** Current metric value */
      current?: number;
      /** Baseline metric value for comparison */
      baseline?: number;
      /** Computed difference between current and baseline */
      change?: number;
    };
    /** Overall flaky rate with baseline comparison */
    flakyRate?: {
      /** Current metric value */
      current?: number;
      /** Baseline metric value for comparison */
      baseline?: number;
      /** Computed difference between current and baseline */
      change?: number;
    };
    /** Average run duration with baseline comparison */
    averageRunDuration?: {
      /** Current metric value */
      current?: number;
      /** Baseline metric value for comparison */
      baseline?: number;
      /** Computed difference between current and baseline */
      change?: number;
    };
    /** 95th percentile run duration with baseline comparison */
    p95RunDuration?: {
      /** Current metric value */
      current?: number;
      /** Baseline metric value for comparison */
      baseline?: number;
      /** Computed difference between current and baseline */
      change?: number;
    };
    /** Average test duration with baseline comparison */
    averageTestDuration?: {
      /** Current metric value */
      current?: number;
      /** Baseline metric value for comparison */
      baseline?: number;
      /** Computed difference between current and baseline */
      change?: number;
    };
    /** Number of historical runs analyzed for insights */
    runsAnalyzed?: number;
    /** Extension point for arbitrary metadata */
    extra?: {
      [k: string]: unknown;
    };
  };
  /** Reference to a previous report used for comparison */
  baseline?: {
    /** UUID of the baseline report */
    reportId: string;
    /** Generation time of the baseline report */
    timestamp?: string;
    /** Origin or location of the baseline report */
    source?: string;
    /** Build number of the baseline run */
    buildNumber?: number;
    /** Build name of the baseline run */
    buildName?: string;
    /** URL to the baseline build */
    buildUrl?: string;
    /** Git commit SHA of the baseline run */
    commit?: string;
    /** Extension point for arbitrary metadata */
    extra?: {
      [k: string]: unknown;
    };
  };
}

export const createEmptyTestResults = (): CommonTestReport['results'] => ({
  tool: {
    name: ''
  },
  summary: {
    failed: 0,
    other: 0,
    passed: 0,
    pending: 0,
    skipped: 0,
    start: 0,
    stop: 0,
    tests: 0,
    duration: 0
  },
  tests: []
});
