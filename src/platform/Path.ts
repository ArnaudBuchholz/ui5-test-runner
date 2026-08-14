import { basename, dirname, extname, isAbsolute, join, relative } from 'node:path';

export class Path {
  static readonly basename = basename;
  static readonly dirname = dirname;
  static readonly extname = extname;
  static readonly isAbsolute = isAbsolute;
  static readonly join = join;
  static readonly relative = relative;
}
