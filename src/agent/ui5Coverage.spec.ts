import { it, expect, beforeEach, describe, vi } from 'vitest';

const nativeOpen = vi.spyOn(XMLHttpRequest.prototype, 'open');

await import('./ui5Coverage.js');

beforeEach(() => {
  delete (window as { sap?: unknown }).sap;
  nativeOpen.mockClear();
});

describe('HTMLScriptElement.prototype.setAttribute', () => {
  it('appends instrument=true to src when name is data-sap-ui-module', () => {
    const script = document.createElement('script');
    script.src = 'https://example.com/Component.js';
    const attribute = 'data-sap-ui-module';
    script.setAttribute(attribute, 'some.Module');
    expect(script.src).toBe('https://example.com/Component.js?instrument=true');
    expect(script.getAttribute(attribute)).toBe('some.Module');
  });

  it('does not modify src for unrelated attributes', () => {
    const script = document.createElement('script');
    script.src = 'https://example.com/Component.js';
    script.setAttribute('type', 'text/javascript');
    expect(script.src).toBe('https://example.com/Component.js');
  });
});

describe('XMLHttpRequest.prototype.open', () => {
  const simulateSapUiLoader = () => {
    (window as { sap?: unknown }).sap = { ui: { loader: {} } };
  };

  it('appends instrument=true to .js URLs when sap.ui.loader is present', () => {
    simulateSapUiLoader();
    new XMLHttpRequest().open('GET', 'https://example.com/Component.js');
    expect(nativeOpen).toHaveBeenCalledWith(
      'GET',
      'https://example.com/Component.js?instrument=true',
      true,
      undefined,
      undefined
    );
  });

  it('does not modify non-.js URLs even when sap.ui.loader is present', () => {
    simulateSapUiLoader();
    new XMLHttpRequest().open('GET', 'https://example.com/data.json');
    expect(nativeOpen).toHaveBeenCalledWith('GET', 'https://example.com/data.json', true, undefined, undefined);
  });

  it('does not modify .js URLs when sap is not present', () => {
    new XMLHttpRequest().open('GET', 'https://example.com/Component.js');
    expect(nativeOpen).toHaveBeenCalledWith('GET', 'https://example.com/Component.js', true, undefined, undefined);
  });

  it('does not modify .js URLs when sap.ui is not present', () => {
    (window as { sap?: unknown }).sap = {};
    new XMLHttpRequest().open('GET', 'https://example.com/Component.js');
    expect(nativeOpen).toHaveBeenCalledWith('GET', 'https://example.com/Component.js', true, undefined, undefined);
  });

  it('does not modify .js URLs when sap.ui.loader is not present', () => {
    (window as { sap?: unknown }).sap = { ui: {} };
    new XMLHttpRequest().open('GET', 'https://example.com/Component.js');
    expect(nativeOpen).toHaveBeenCalledWith('GET', 'https://example.com/Component.js', true, undefined, undefined);
  });

  it('defaults isAsync to true when not provided', () => {
    simulateSapUiLoader();
    new XMLHttpRequest().open('GET', 'https://example.com/Component.js');
    expect(nativeOpen.mock.calls[0]?.[2]).toBe(true);
  });

  it('preserves explicit isAsync=false', () => {
    simulateSapUiLoader();
    new XMLHttpRequest().open('GET', 'https://example.com/Component.js', false);
    expect(nativeOpen.mock.calls[0]?.[2]).toBe(false);
  });
});
