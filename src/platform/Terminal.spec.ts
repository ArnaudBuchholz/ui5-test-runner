import { it, expect, vi, describe, beforeEach } from 'vitest';
import type { Terminal as TerminalType } from './Terminal.js';
const { Terminal } = await vi.importActual<{ Terminal: typeof TerminalType }>('./Terminal.js');

vi.spyOn(process.stdout, 'on');
vi.spyOn(process.stdout, 'write');
vi.spyOn(process.stdin, 'on');
process.stdin.setRawMode = vi.fn();
process.stdin.pause = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe('onResize', () => {
  it('wraps process.stdout.on(resize)', () => {
    Terminal.onResize(() => {});
    expect(process.stdout.on).toHaveBeenCalledWith('resize', expect.any(Function) as () => void);
  });

  it('calls the callback with the width', () => {
    const width = Terminal.width;
    const onResize = vi.fn();
    Terminal.onResize(onResize);
    const callback = vi.mocked(process.stdout.on).mock.calls.at(-1)![1];
    callback();
    expect(onResize).toHaveBeenCalledWith(width);
  });
});

describe('setRawMode', () => {
  it('enables the use of raw mode', () => {
    const callback = vi.fn();
    Terminal.setRawMode(callback);
    expect(process.stdin.setRawMode).toHaveBeenCalledWith(true);
    expect(process.stdin.on).toHaveBeenCalledWith('data', callback);
  });

  it('disables the use of raw mode', () => {
    Terminal.setRawMode(false);
    expect(process.stdin.setRawMode).toHaveBeenCalledWith(false);
    expect(process.stdin.pause).toHaveBeenCalled();
  });
});

describe('write', () => {
  it('wraps process.stdout.write', () => {
    Terminal.write('abc');
    expect(process.stdout.write).toHaveBeenCalledWith('abc');
  });
});

describe('escape sequences', () => {
  it('supports SETCOLUMN(column)', () => {
    expect(Terminal.SETCOLUMN(10)).toStrictEqual('\u001B[10G');
  });

  it('supports UP(number of lines)', () => {
    expect(Terminal.UP(10)).toStrictEqual('\u001B[10A');
  });
});
