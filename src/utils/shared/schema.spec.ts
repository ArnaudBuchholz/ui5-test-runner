import { it, expect } from 'vitest';
import { validate } from './schema.js';

const userSchema = {
  name: 'string',
  age: 'number',
  address: {
    street: 'string',
    city: 'string',
    zipCode: 'number'
  }
} as const;

it('validates an object respecting the schema', () => {
  expect(() =>
    validate(
      {
        name: 'John Doe',
        age: 42,
        address: {
          street: 'No name',
          city: 'Gotham',
          zipCode: 123
        }
      },
      userSchema
    )
  ).not.toThrow();
});

it.each([
  {
    name: 'John Doe',
    age: 42
  },
  {
    name: null,
    age: 42,
    address: {
      street: 'No name',
      city: 'Gotham',
      zipCode: 123
    }
  }
])('invalidates an object not respecting the schema (%s)', (value) => {
  expect(() => validate(value, userSchema)).toThrow(TypeError);
});
