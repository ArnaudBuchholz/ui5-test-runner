import { basename, join, isAbsolute, dirname } from 'node:path';

export class Path {
  static readonly basename = basename;
  static readonly dirname = dirname;
  static readonly isAbsolute = isAbsolute;
  static readonly join = join;
}
