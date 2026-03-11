import { access, stat, constants, readFile, mkdir, rm } from 'node:fs/promises';
import { createReadStream, createWriteStream, writeFileSync } from 'node:fs';

export class FileSystem {
  static readonly access = access;
  static readonly constants = constants;
  static readonly createReadStream = createReadStream;
  static readonly createWriteStream = createWriteStream;
  static readonly mkdir = mkdir;
  static readonly readFile = readFile;
  static readonly rm = rm;
  static readonly stat = stat;
  static readonly writeFileSync = writeFileSync;
}
