import { stat, access } from 'node:fs/promises';

/** This class simplifies mocking during tests */
export class Platform {
  static readonly stat = stat;
  static readonly access = access;
}
