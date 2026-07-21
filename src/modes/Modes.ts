export const Modes = {
  batch: 'batch',
  dumpConfig: 'dumpConfig',
  help: 'help',
  legacy: 'legacy',
  log: 'log',
  remote: 'remote',
  version: 'version'
} as const;

export type Modes = (typeof Modes)[keyof typeof Modes];
