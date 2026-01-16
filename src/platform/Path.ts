import { join, isAbsolute } from 'node:path';

export class Path {
  static readonly isAbsolute = isAbsolute;
  static readonly join = join;
}
