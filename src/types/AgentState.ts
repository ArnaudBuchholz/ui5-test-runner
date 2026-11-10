import type { IError } from './IError.js';

export const agentLogPrefix = '[ui5-test-runner]';

export type SuitePage = {
  /** Test page URL */
  url: string;
  /** Per-page coverage filters declared in the testsuite config */
  coverage?: { only?: string | string[]; never?: string | string[] };
};

export type AgentState = {
  loaded?: ReturnType<typeof Date.now>;
  done: boolean;
  uncaughtErrors?: (IError & { event: string })[];
} & (
  | {
      /** Unknown yet */
      type: undefined;
    }
  | {
      /** Not able to determine type */
      type: 'unknown';
    }
  | {
      /** Suite of tests */
      type: 'suite';
      /** Test pages to run */
      pages: SuitePage[];
    }
  | {
      /** Tests */
      type: 'QUnit';
      /** Detect OPA tests */
      isOpa: boolean;
      /** Number of tests executed so far (including errors) */
      executed: number;
      /** Number of errors so far */
      errors: number;
      /** Total number of tests */
      total: number;
      /** Filename requested by the agent for the next screenshot, or false when none pending */
      pendingScreenshot: string | false;
    }
);
