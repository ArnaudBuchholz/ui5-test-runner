import zlib from 'node:zlib';

export class ZLib {
  static readonly constants = zlib.constants;
  static readonly createGzip = zlib.createGzip.bind(zlib);
  static readonly createGunzip = zlib.createGunzip.bind(zlib);
}
