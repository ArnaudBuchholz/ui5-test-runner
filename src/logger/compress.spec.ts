import { it, expect, describe } from 'vitest';
import { InternalLogAttributes, LogLevel } from './types.js';
import { createCompressionContext, compress, uncompress } from './compress.js';

for (const attributes of [{
  timestamp: Date.now(),
  level: LogLevel.info,
  processId: 123,
  threadId: 456,
  isMainThread: true,
  source: 'job',
  message: 'Simple trace',
}] satisfies InternalLogAttributes[]) {

  describe(attributes.message, () => {
    const context = createCompressionContext();
    let compressed: string;

    it('reduces message size', () => {
      const json = JSON.stringify(attributes);
      compressed = compress(context, attributes);
      expect(json.length).toBeLessThan(compressed.length);
    });

    it('keeps the message integrity', () => {
      const uncompressed = uncompress(context, compressed);
      expect(uncompressed).toStrictEqual(attributes);
    });
  });
}
