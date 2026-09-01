import { it, expect, describe } from 'vitest';
import { countCpuModels, formatHostLabel } from './host.js';

describe('countCpuModels', () => {
  it('returns empty array for no CPUs', () => {
    expect(countCpuModels([])).toEqual([]);
  });

  it('counts a single model', () => {
    expect(countCpuModels([{ model: 'x86' }])).toEqual([{ model: 'x86', count: 1 }]);
  });

  it('counts multiple identical models', () => {
    expect(countCpuModels([{ model: 'x86' }, { model: 'x86' }])).toEqual([{ model: 'x86', count: 2 }]);
  });

  it('counts distinct models separately', () => {
    expect(countCpuModels([{ model: 'x86' }, { model: 'x86' }, { model: 'GPU' }])).toEqual([
      { model: 'x86', count: 2 },
      { model: 'GPU', count: 1 }
    ]);
  });
});

describe('formatHostLabel', () => {
  it('shows machine only when no CPUs', () => {
    expect(formatHostLabel({ machine: 'arm64', cpus: [] })).toBe('arm64');
  });

  it('shows machine and single CPU model without count', () => {
    expect(formatHostLabel({ machine: 'arm64', cpus: [{ model: 'Apple M2' }] })).toBe('arm64 / Apple M2');
  });

  it('shows count when multiple identical CPUs', () => {
    expect(formatHostLabel({ machine: 'arm64', cpus: [{ model: 'Apple M2' }, { model: 'Apple M2' }] })).toBe(
      'arm64 / 2x Apple M2'
    );
  });

  it('joins multiple distinct models with comma', () => {
    expect(formatHostLabel({ machine: 'x64', cpus: [{ model: 'x86' }, { model: 'x86' }, { model: 'GPU' }] })).toBe(
      'x64 / 2x x86, GPU'
    );
  });
});
