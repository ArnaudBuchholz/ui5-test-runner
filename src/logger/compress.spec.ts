import { it, expect, describe } from 'vitest';
import type { InternalLogAttributes } from './types.js';
import { LogLevel } from './types.js';
import { createCompressionContext, compress, uncompress } from './compress.js';

for (const attributes of [
  {
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: 123,
    threadId: 456,
    isMainThread: true,
    source: 'job',
    message: 'Simple trace'
  }
] satisfies InternalLogAttributes[]) {
  describe(attributes.message, () => {
    let compressed: string;

    it('reduces message size', () => {
      const context = createCompressionContext();
      const json = JSON.stringify(attributes);
      compressed = compress(context, attributes);
      expect(compress.length).toBeLessThan(json.length);
    });

    it('keeps the message integrity', () => {
      const context = createCompressionContext();
      const uncompressed = uncompress(context, compressed);
      expect(uncompressed).toStrictEqual(attributes);
    });
  });
}
