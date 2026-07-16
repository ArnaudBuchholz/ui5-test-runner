import punyexpr from 'punyexpr';
import { Host } from '../../platform/index.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- punyexpr types use `any` internally
export const shouldExecuteIf = (condition: string): boolean => {
  const [major] = process.version.slice(1).split('.');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- punyexpr types use `any` internally
  return !!(punyexpr(condition) as (context: Record<string, unknown>) => unknown)({
    ...Host.env,
    NODE_MAJOR_VERSION: Number(major)
  });
};
