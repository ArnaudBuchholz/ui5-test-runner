const literalPrototype = Object.getPrototypeOf({}) as object;

export const toPlainObject = (object: object): object => {
  const prototype = Object.getPrototypeOf(object) as object;
  if (Object.getPrototypeOf(object) === literalPrototype) {
    return object;
  }
  return Object.assign({}, toPlainObject(prototype), object);
};

export const pick = <T extends object, K extends keyof T>(object: T, keys: readonly K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in object) {
      result[key] = object[key];
    }
  }
  return result;
};
