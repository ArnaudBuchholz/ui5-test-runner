type PrimitiveTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  object: object;
};

// Use interface instead of type alias for recursion
interface Schema {
  [key: string]: keyof PrimitiveTypeMap | Schema;
}

type InferTypeFrom<T extends Schema> = {
  [K in keyof T]: T[K] extends keyof PrimitiveTypeMap
    ? PrimitiveTypeMap[T[K]]
    : T[K] extends Schema
      ? InferTypeFrom<T[K]>
      : never;
};

export function validate<T extends Schema>(value: unknown, schema: T): asserts value is InferTypeFrom<T> {
  if (value === null || typeof value !== 'object') {
    throw new TypeError(`Expected an object, got ${typeof value}`);
  }

  const object = value as Record<string, unknown>;

  for (const [key, schemaValue] of Object.entries(schema)) {
    if (!(key in object)) {
      throw new TypeError(`Missing required property: "${key}"`);
    }

    if (typeof schemaValue === 'string') {
      const actualType = typeof object[key];
      if (actualType !== schemaValue) {
        throw new TypeError(`Property "${key}" has type "${actualType}", expected "${schemaValue}"`);
      }
    } else {
      validate(object[key], schemaValue);
    }
  }
}
