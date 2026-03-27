import type { TimeRange, RelativePreset } from './types.js';

const PRESET_LABELS: Record<RelativePreset, string> = {
  '5m': 'Last 5 minutes',
  '15m': 'Last 15 minutes',
  '30m': 'Last 30 minutes',
  '1h': 'Last 1 hour',
  '3h': 'Last 3 hours',
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours'
};

const PRESET_MS: Record<RelativePreset, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000
};

export const RELATIVE_PRESETS: RelativePreset[] = ['5m', '15m', '30m', '1h', '3h', '6h', '24h'];

export function getPresetLabel(preset: RelativePreset): string {
  return PRESET_LABELS[preset];
}

export function resolveTimeRange(range: TimeRange): { from: number; to: number } {
  if (range.mode === 'absolute') {
    return { from: range.from, to: range.to };
  }
  const now = Date.now();
  return { from: now - PRESET_MS[range.preset], to: now };
}

const pad = (n: number, length = 2) => String(n).padStart(length, '0');

export function formatTimestamp(epoch: number): string {
  const date = new Date(epoch);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
  );
}

export function formatDatetimeLocal(epoch: number): string {
  const date = new Date(epoch);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function parseDatetimeLocal(value: string): number {
  return new Date(value).getTime();
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${bytes}B`;
}
