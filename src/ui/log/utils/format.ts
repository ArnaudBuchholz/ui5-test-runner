import type { LogLevel } from '../../../platform/logger/types.js';

const LEVEL_ICONS: Record<LogLevel, string> = {
  0: '&#128269;',
  1: '&#128172;',
  2: '&#9888;&#65039;',
  3: '&#10060;',
  4: '&#128163;'
};

const LEVEL_NAMES: Record<LogLevel, string> = {
  0: 'debug',
  1: 'info',
  2: 'warn',
  3: 'error',
  4: 'fatal'
};

const BYTES_UNITS = ['B', 'KB', 'MB', 'GB'];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function levelIcon(level: LogLevel): string {
  return LEVEL_ICONS[level] ?? '?';
}

export function levelName(level: LogLevel): string {
  return LEVEL_NAMES[level] ?? 'unknown';
}

export function formatTimestamp(epoch: number): string {
  if (!epoch) {
    return '—';
  }
  return new Date(epoch).toLocaleString();
}

export function epochToDateTimePickerValue(epoch: number): string {
  const date = new Date(epoch);
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < BYTES_UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const formatted = unitIndex === 0 ? value.toString() : value.toFixed(1);
  return `${formatted} ${BYTES_UNITS[unitIndex]}`;
}
