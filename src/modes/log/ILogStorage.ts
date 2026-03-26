import type { InternalLogAttributes } from '../../platform/logger/types.js';

export const MAX_LIMIT = 1000;

export type LogStorageQuery = {
  from?: number;
  to?: number;
  filter?: string;
  skip?: number;
  /** defaulted to MAX_LIMIT and cannot exceed it */
  limit?: number;
};

export interface ILogStorage {
  readonly length: number;
  add(log: InternalLogAttributes): void;
  /** Always sorted by timestamp */
  fetch(query?: LogStorageQuery): InternalLogAttributes[];
}
