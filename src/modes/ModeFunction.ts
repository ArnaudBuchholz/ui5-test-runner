import type { Configuration } from '../configuration/Configuration.js';

export type ModeFunction = (configuration: Configuration) => Promise<void> | void;
