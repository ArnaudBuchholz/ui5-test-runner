export type AgentResponse = {
  status: 'pending' | 'done';
} & (
  | {
      /** Suite of tests */
      type: 'suite';
      /** Test pages to run */
      pages: string[];
    }
  | {
      /** Tests */
      type: 'QUnit';
      /** OPA detected */
      opa: boolean;
      /** Number of tests executed so far */
      executed: number;
      /** Total number of tests */
      total: number;
    }
);
