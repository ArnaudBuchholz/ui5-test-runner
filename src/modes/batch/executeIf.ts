import punyexpr from 'punyexpr';
import { Host } from '../../platform/index.js';

export const executeIf = (condition: string): boolean => {
  const [major] = process.version.slice(1).split('.');
  return !!punyexpr(condition)({
    ...Host.env,
    NODE_MAJOR_VERSION: Number(major)
  });
};
