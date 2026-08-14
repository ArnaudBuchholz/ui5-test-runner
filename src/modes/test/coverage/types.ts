export type IstanbulSettings = {
  all?: boolean;
  sourceMap?: boolean;
  coverageGlobalScope?: string;
  coverageGlobalScopeFunc?: boolean;
  cwd?: string;
  exclude?: string[];
  [key: string]: unknown;
};
