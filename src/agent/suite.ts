class jsUnitTestSuite {
  private static _pages: string[] = [];

  static get pages () {
    return this._pages;
  }

  static addTestPage (url: string) {
    this._pages.push(url);
  }
}

Object.assign(window, { jsUnitTestSuite });
