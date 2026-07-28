import { createRequire, findPackageJSON } from 'node:module';

export class Module {
  static readonly createRequire = createRequire;
  static readonly findPackageJSON = findPackageJSON;
}
