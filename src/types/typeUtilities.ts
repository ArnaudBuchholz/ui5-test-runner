export type Equal<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2 ? true : false;
export type Expect<T extends true> = T;

export type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

export type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [P in K]: T[P] }, { -readonly [P in K]: T[P] }, K>;
}[keyof T];

export type Writable<T> = Pick<T, WritableKeys<T>>;

export type IsPlainObject<T> = T extends object
  ? T extends () => unknown
    ? false
    : T extends readonly unknown[]
      ? false
      : true
  : false;

export type DotPaths<T> = T extends unknown
  ? {
      [K in keyof T & (string | number)]: IsPlainObject<T[K]> extends true
        ? `${K}` | `${K}.${DotPaths<T[K]>}`
        : `${K}`;
    }[keyof T & (string | number)]
  : never;

export type DotPaths_Tests = {
  'works on first level': Expect<Equal<DotPaths<{ a: boolean; b: number;}>, 'a' | 'b'>>,
  'works on second level': Expect<Equal<DotPaths<{ c: { a: boolean; b: number; }; }>, 'c' | 'c.a' | 'c.b'>>,
  'works on discriminated union': Expect<Equal<DotPaths<{ c: { a: 1; b: number; } | { a: 2; d: string; }; }>, 'c' | 'c.a' | 'c.b' | 'c.d'>>,
}

export type LeafValueTypes<T> = T extends readonly (infer U)[]
  ? LeafValueTypes<U> | T
  : T extends object
    ? { [K in keyof T]: LeafValueTypes<T[K]> }[keyof T]
    : T;
