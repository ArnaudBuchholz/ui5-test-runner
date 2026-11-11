import { Modes } from '../modes/Modes.js';
import type { InferOptionType, Option } from './Option.js';
import type { options, defaults } from './options.js';

type HasDefault<T extends { name: string }> = T['name'] extends keyof typeof defaults ? true : false;
type ConfigType<T extends Option> = T['multiple'] extends true
  ? InferOptionType<T['type']>[]
  : InferOptionType<T['type']>;
type ConfigKeys = (typeof options)[number]['name'];
type GetConfig<K extends ConfigKeys> = Extract<(typeof options)[number], { name: K }>;

/** Members of Configuration that are not options: set at validation/execution time, not parsed. */
export type ConfigurationStructuralMembers = {
  mode: Modes;
  sources: { [key in string]?: 'cli' | 'config' };
  /** State computed during execution — not from CLI/config, not an option. See ADR-0015. */
  runtime: {
    /** A testsuite declared per-page coverage only/never, so the nyc baseline must be dropped before reporting */
    coverageBaselineInvalidated?: true;
  };
};

export type Configuration = {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? K : never]: ConfigType<GetConfig<K>>;
} & {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? never : K]?: ConfigType<GetConfig<K>>;
} & ConfigurationStructuralMembers;

/**
 * The non-option structural members initialized to their empty/default values. `mode` defaults to
 * `Modes.help` — the validator always overrides it via `computeMode`, so the default only serves
 * constructions that never run the full validation path (e.g. unit fixtures). Spread this when
 * constructing a Configuration from scratch so new structural members flow in automatically.
 * See ADR-0015.
 */
export const createConfigurationStructuralMembers = (): ConfigurationStructuralMembers => ({
  mode: Modes.help,
  sources: {},
  runtime: {}
});
