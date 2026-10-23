import { it, expect, beforeEach, describe, vi } from 'vitest';
import type { Configuration } from './Configuration.js';

vi.mock(import('./config.js'), () => ({ getConfig: vi.fn() }));
import { getConfig } from './config.js';

// The agent monkey-patches these prototypes on import; restore the originals before each fresh
// import so patches do not stack across tests. The spy is installed on the restored original so
// the patch captures it as the native open and assertions see the URL the patch forwards.
const originalOpen = XMLHttpRequest.prototype.open;
const originalSetAttribute = HTMLScriptElement.prototype.setAttribute;
let nativeOpen = vi.spyOn(XMLHttpRequest.prototype, 'open');

const loadAgent = async (coverageRemoteInstrument?: string[]) => {
  XMLHttpRequest.prototype.open = originalOpen;
  HTMLScriptElement.prototype.setAttribute = originalSetAttribute;
  nativeOpen = vi.spyOn(XMLHttpRequest.prototype, 'open');
  vi.mocked(getConfig).mockReturnValue({ coverageRemoteInstrument } as Configuration);
  vi.resetModules();
  await import('./ui5Coverage.js');
};

beforeEach(async () => {
  delete (window as { sap?: unknown }).sap;
  await loadAgent();
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

  it('does not append instrument=true to framework resources by default', () => {
    const script = document.createElement('script');
    script.src = 'https://example.com/resources/sap/ui/core/Core.js';
    const attribute = 'data-sap-ui-module';
    script.setAttribute(attribute, 'sap.ui.core.Core');
    expect(script.src).toBe('https://example.com/resources/sap/ui/core/Core.js');
  });

  it('appends instrument=true to a resources sub-path matching a pattern', async () => {
    await loadAgent(['^my/lib/']);
    const script = document.createElement('script');
    script.src = 'https://example.com/resources/my/lib/Button.js';
    const attribute = 'data-sap-ui-module';
    script.setAttribute(attribute, 'my.lib.Button');
    expect(script.src).toBe('https://example.com/resources/my/lib/Button.js?instrument=true');
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

  it('does not modify framework resources URLs by default', () => {
    simulateSapUiLoader();
    new XMLHttpRequest().open('GET', 'https://example.com/resources/sap/ui/core/Core.js');
    expect(nativeOpen).toHaveBeenCalledWith(
      'GET',
      'https://example.com/resources/sap/ui/core/Core.js',
      true,
      undefined,
      undefined
    );
  });

  it('does not modify test-resources URLs by default', () => {
    simulateSapUiLoader();
    new XMLHttpRequest().open('GET', 'https://example.com/test-resources/my/lib/Test.js');
    expect(nativeOpen).toHaveBeenCalledWith(
      'GET',
      'https://example.com/test-resources/my/lib/Test.js',
      true,
      undefined,
      undefined
    );
  });

  it('appends instrument=true to a resources sub-path matching a pattern', async () => {
    await loadAgent(['^my/lib/']);
    simulateSapUiLoader();
    new XMLHttpRequest().open('GET', 'https://example.com/resources/my/lib/Button.js');
    expect(nativeOpen).toHaveBeenCalledWith(
      'GET',
      'https://example.com/resources/my/lib/Button.js?instrument=true',
      true,
      undefined,
      undefined
    );
  });

  it('does not modify a resources sub-path not matching any pattern', async () => {
    await loadAgent(['^my/lib/']);
    simulateSapUiLoader();
    new XMLHttpRequest().open('GET', 'https://example.com/resources/sap/m/Button.js');
    expect(nativeOpen).toHaveBeenCalledWith(
      'GET',
      'https://example.com/resources/sap/m/Button.js',
      true,
      undefined,
      undefined
    );
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
