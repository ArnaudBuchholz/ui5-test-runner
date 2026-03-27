import type { LogEntry } from './types.js';
import { levelToString } from './apiClient.js';

export type FilterField = 'source' | 'level' | 'processId' | 'threadId' | 'message';

export function buildIncludeFilter(field: FilterField, value: string | number): string {
  if (field === 'message') {
    return `message.includes(${JSON.stringify(String(value))})`;
  }
  if (field === 'level') {
    return `level === ${JSON.stringify(levelToString(Number(value)))}`;
  }
  return `${field} === ${JSON.stringify(value)}`;
}

export function buildExcludeFilter(field: FilterField, value: string | number): string {
  if (field === 'message') {
    return `!message.includes(${JSON.stringify(String(value))})`;
  }
  if (field === 'level') {
    return `level !== ${JSON.stringify(levelToString(Number(value)))}`;
  }
  return `${field} !== ${JSON.stringify(value)}`;
}

export function appendFilter(existing: string, addition: string): string {
  const trimmed = existing.trim();
  if (!trimmed) {
    return addition;
  }
  return `${trimmed} && ${addition}`;
}

export function searchEntries(entries: LogEntry[], searchText: string): LogEntry[] {
  if (!searchText) {
    return entries;
  }
  const lower = searchText.toLowerCase();
  return entries.filter(
    (entry) => entry.message.toLowerCase().includes(lower) || entry.source.toLowerCase().includes(lower)
  );
}
