export type Status = {
  status: 'pending' | 'done';
} & (
  | {
      type: 'suite';
      pages: string[];
    }
  | {
      type: 'QUnit';
    }
);
