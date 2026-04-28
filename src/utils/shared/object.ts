const literalPrototype = Object.getPrototypeOf({}) as object;

export const toPlainObject = (object: object): object => {
  const prototype = Object.getPrototypeOf(object) as object;
  if (Object.getPrototypeOf(object) === literalPrototype) {
    return object;
  }
  return Object.assign({}, toPlainObject(prototype), object);
};
