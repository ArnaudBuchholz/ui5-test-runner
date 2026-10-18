/*
 * This file is generated from the option documentation in docs/options/*.md.
 * Do NOT edit it by hand — run `make options` to regenerate it.
 */
import { punyexpr } from 'punyexpr';
import type { Configuration } from './Configuration.js';

export const derivations: Array<(configuration: Configuration) => void> = [
  (configuration) => {
    if (punyexpr('llm')(configuration)) {
      Object.assign(configuration, { ci: true, noBanner: true });
    }
  }
];
