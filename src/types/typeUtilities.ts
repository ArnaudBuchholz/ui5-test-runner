export type Equal<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2 ? true : false;
export type Expect<T extends true> = T;

export type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

export type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [P in K]: T[P] }, { -readonly [P in K]: T[P] }, K>;
}[keyof T];

export type Writable<T> = Pick<T, WritableKeys<T>>;

export type Writable_Tests = {
  'picks only writable properties': Expect<Equal<Writable<{ a: boolean; readonly b: number }>, { a: boolean }>>;
};

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
