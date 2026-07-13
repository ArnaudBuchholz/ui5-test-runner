import { join, isAbsolute, dirname } from 'node:path';

export class Path {
  static readonly dirname = dirname;
  static readonly isAbsolute = isAbsolute;
  static readonly join = join;
}
