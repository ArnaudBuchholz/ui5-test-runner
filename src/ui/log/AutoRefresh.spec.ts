import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAutoRefreshController } from './AutoRefresh.js';

describe('createAutoRefreshController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the callback after the given interval', () => {
    vi.useFakeTimers();
    const controller = createAutoRefreshController();
    const callback = vi.fn();

    controller.start(5, callback);
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(2);

    controller.stop();
  });

  it('stops calling the callback after stop()', () => {
    vi.useFakeTimers();
    const controller = createAutoRefreshController();
    const callback = vi.fn();

    controller.start(10, callback);
    controller.stop();

    vi.advanceTimersByTime(30_000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('replaces the existing timer when start() is called again', () => {
    vi.useFakeTimers();
    const controller = createAutoRefreshController();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    controller.start(5, callback1);
    controller.start(10, callback2);

    vi.advanceTimersByTime(10_000);
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);

    controller.stop();
  });
});
