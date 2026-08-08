type UI5Object = {
  getId: () => string;
  getMetadata: () => {
    getName: () => string;
  };
};

const isUI5Object: (object: unknown) => object is UI5Object = (object): object is UI5Object =>
  typeof object === 'object' &&
  object !== null &&
  'getId' in object &&
  typeof object.getId === 'function' &&
  'getMetadata' in object &&
  typeof object.getMetadata === 'function';

const ui5Summary = (object: UI5Object) => ({
  'ui5:class': object.getMetadata().getName(),
  'ui5:id': object.getId()
});

export const stringify = (data: unknown): string => {
  const objects: unknown[] = [];
  const referenced: unknown[] = [];
  const simple = JSON.stringify(data, function (key, value: unknown) {
    if (typeof value === 'object' && value) {
      if (isUI5Object(value)) {
        return ui5Summary(value);
      }
      const id = objects.indexOf(value);
      if (id !== -1) {
        referenced[id] = true;
        return null; // Skip error and check all references
      }
      objects.push(value);
    }
    return value;
  });
  if (referenced.length === 0) {
    return simple;
  }
  const stringified: boolean[] = [];
  return JSON.stringify(data, function (key, value: unknown) {
    if (typeof value === 'object' && value) {
      if (isUI5Object(value)) {
        return ui5Summary(value);
      }
      const id = objects.indexOf(value);
      if (referenced[id]) {
        if (stringified[id]) {
          return { 'circular:ref': id };
        }
        stringified[id] = true;
        if (Array.isArray(value)) {
          return {
            'circular:id': id,
            'circular:array': [...(value as unknown[])]
          };
        }
        return {
          'circular:id': id,
          ...value
        };
      }
    }
    return value;
  });
};
