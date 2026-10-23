// inspired from ui5/resources/sap/ui/qunit/qunit-coverage-istanbul-dbg.js

import { getConfig } from './config.js';
import { memoize } from '../utils/shared/memoize.js';

// resources/ and test-resources/ hold UI5 framework and library sources. Instrumenting them in
// remote mode busts the cache and defeats preload bundling, so they are excluded by default; the
// coverageRemoteInstrument patterns (matched against the sub-path below resources/) opt them back
// in — needed when testing a library whose own sources are served under resources/.
// Patterns are compiled once on first use (not at import, where the config may not be set yet).
const getInstrumentPatterns = memoize(() =>
  // eslint-disable-next-line security/detect-non-literal-regexp -- patterns are a user-supplied option
  (getConfig().coverageRemoteInstrument ?? []).map((pattern) => new RegExp(pattern))
);

function shouldInstrument(pathname: string): boolean {
  if (!pathname.endsWith('.js')) {
    return false;
  }
  const match = /(?:^|\/)(?:test-)?resources\/(.*)$/.exec(pathname);
  if (match) {
    const subPath = match[1]!;
    return getInstrumentPatterns().some((pattern) => pattern.test(subPath));
  }
  return true;
}

function appendUrlParameter(url: string) {
  const urlObject = new URL(url, document.baseURI);
  urlObject.searchParams.set('instrument', 'true');
  return urlObject.toString();
}

const nativeSetAttribute = HTMLScriptElement.prototype.setAttribute;
HTMLScriptElement.prototype.setAttribute = function (this: HTMLScriptElement, name, value) {
  if (name === 'data-sap-ui-module' && shouldInstrument(new URL(this.src, document.baseURI).pathname)) {
    this.src = appendUrlParameter(this.src);
  }
  nativeSetAttribute.call(this, name, value);
};

const nativeXhrOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (
  this: XMLHttpRequest,
  method: string,
  url: string | URL,
  isAsync?: boolean,
  username?: string | null,
  password?: string | null
) {
  const actualUrl =
    url &&
    window.sap &&
    window.sap.ui &&
    window.sap.ui.loader &&
    shouldInstrument(new URL(url.toString(), document.baseURI).pathname)
      ? appendUrlParameter(url.toString())
      : url;
  return nativeXhrOpen.call(this, method, actualUrl, isAsync ?? true, username, password);
};
