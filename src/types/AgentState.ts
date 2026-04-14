export type AgentState = {
  loaded?: ReturnType<typeof Date.now>;
  done: boolean;
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
      pages: string[];
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
    }
);
