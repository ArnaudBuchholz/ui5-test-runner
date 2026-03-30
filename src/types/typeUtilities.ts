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

export type DotPaths<T> = {
  [K in keyof T & (string | number)]: IsPlainObject<T[K]> extends true ? `${K}` | `${K}.${DotPaths<T[K]>}` : `${K}`;
}[keyof T & (string | number)];

export type LeafValueTypes<T> = T extends readonly (infer U)[]
  ? LeafValueTypes<U> | T
  : T extends object
    ? { [K in keyof T]: LeafValueTypes<T[K]> }[keyof T]
    : T;
