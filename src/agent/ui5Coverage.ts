// inspired from ui5/resources/sap/ui/qunit/qunit-coverage-istanbul-dbg.js

function appendUrlParameter(url: string) {
  const urlObject = new URL(url, document.baseURI);
  urlObject.searchParams.set('instrument', 'true');
  return urlObject.toString();
}

const nativeSetAttribute = HTMLScriptElement.prototype.setAttribute;
HTMLScriptElement.prototype.setAttribute = function (this: HTMLScriptElement, name, value) {
  if (name === 'data-sap-ui-module') {
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
    url && url.toString().endsWith('.js') && window.sap && window.sap.ui && window.sap.ui.loader
      ? appendUrlParameter(url.toString())
      : url;
  return nativeXhrOpen.call(this, method, actualUrl, isAsync ?? true, username, password);
};
