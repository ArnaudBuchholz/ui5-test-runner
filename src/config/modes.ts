export const Modes = {
  capabilities: 'capabilities',
  legacy: 'legacy',
  remote: 'remote',
  batch: 'batch'
} as const;

export type Modes = (typeof Modes)[keyof typeof Modes];
