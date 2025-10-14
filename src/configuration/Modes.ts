export const Modes = {
  batch: 'batch',
  capabilities: 'capabilities',
  help: 'help',
  legacy: 'legacy',
  remote: 'remote',
  version: 'version'
} as const;

export type Modes = (typeof Modes)[keyof typeof Modes];
