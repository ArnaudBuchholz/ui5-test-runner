import zlib from 'node:zlib';

export class ZLib {
  static readonly constants = zlib.constants;
  static readonly deflateRawSync = zlib.deflateRawSync.bind(zlib);
  static readonly inflateRawSync = zlib.inflateRawSync.bind(zlib);
}
