export type TestMode = 'run' | 'skip' | 'todo' | 'only';

export interface JestTest {
  label: string;
  callback?: () => void | Promise<void>;
  mode: TestMode;
}

export interface JestDescribe {
  label?: string;
  tests: JestTest[];
  describes: JestDescribe[];
  beforeAll: Array<() => void | Promise<void>>;
  beforeEach: Array<() => void | Promise<void>>;
  afterEach: Array<() => void | Promise<void>>;
  afterAll: Array<() => void | Promise<void>>;
}

const createDescribe = (label?: string): JestDescribe => ({
  label,
  tests: [],
  describes: [],
  beforeAll: [],
  beforeEach: [],
  afterEach: [],
  afterAll: []
});

export class Collector {
  readonly root = createDescribe();
  private _current = this.root;

  describe(label: string, callback: () => void): void {
    const parent = this._current;
    const child = createDescribe(label);
    parent.describes.push(child);
    this._current = child;
    callback();
    this._current = parent;
  }

  private addTest(label: string, callback: (() => void | Promise<void>) | undefined, mode: TestMode): void {
    this._current.tests.push({ label, callback, mode });
  }

  readonly test = Object.assign(
    (label: string, callback: () => void | Promise<void>) => this.addTest(label, callback, 'run'),
    {
      only: (label: string, callback: () => void | Promise<void>) => this.addTest(label, callback, 'only'),
      skip: (label: string, callback: () => void | Promise<void>) => this.addTest(label, callback, 'skip'),
      todo: (label: string) => this.addTest(label, undefined, 'todo')
    }
  );

  beforeAll(callback: () => void | Promise<void>): void {
    this._current.beforeAll.push(callback);
  }

  beforeEach(callback: () => void | Promise<void>): void {
    this._current.beforeEach.push(callback);
  }

  afterEach(callback: () => void | Promise<void>): void {
    this._current.afterEach.push(callback);
  }

  afterAll(callback: () => void | Promise<void>): void {
    this._current.afterAll.push(callback);
  }
}
