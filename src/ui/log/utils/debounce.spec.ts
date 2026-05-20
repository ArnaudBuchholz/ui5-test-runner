import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce.js';

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not call the function immediately', () => {
    const function_ = vi.fn();
    const debounced = debounce(function_, 250);
    debounced();
    expect(function_).not.toHaveBeenCalled();
  });

  it('calls the function after the delay', () => {
    const function_ = vi.fn();
    const debounced = debounce(function_, 250);
    debounced('hello');
    vi.advanceTimersByTime(250);
    expect(function_).toHaveBeenCalledOnce();
    expect(function_).toHaveBeenCalledWith('hello');
  });

  it('only executes the last call when called multiple times rapidly', () => {
    const function_ = vi.fn();
    const debounced = debounce(function_, 250);
    debounced('first');
    debounced('second');
    debounced('third');
    vi.advanceTimersByTime(250);
    expect(function_).toHaveBeenCalledOnce();
    expect(function_).toHaveBeenCalledWith('third');
  });

  it('does not call the function before the delay when called rapidly', () => {
    const function_ = vi.fn();
    const debounced = debounce(function_, 250);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(function_).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(function_).toHaveBeenCalledOnce();
  });
});
