export type AgentFeedback = {
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

      count: number;
    }
);
