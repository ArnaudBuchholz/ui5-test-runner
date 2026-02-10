export type State = {
  loaded?: ReturnType<typeof Date.now>;
  done: boolean;
} & (
  | {
      /** Unknown yet */
      type: undefined;
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
      /** Number of tests executed so far */
      executed: number;
      /** Total number of tests */
      total: number;
    }
);

export const state: State = {
  done: false,
  type: undefined
};
