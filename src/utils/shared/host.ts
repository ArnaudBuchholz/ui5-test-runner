export type HostInfo = {
  machine: string;
  cpus: { model: string }[];
};

export type CpuModelCount = {
  model: string;
  count: number;
};

export const countCpuModels = (cpus: HostInfo['cpus']): CpuModelCount[] => {
  const counts: { [key in string]?: number } = {};
  for (const { model } of cpus) {
    counts[model] = (counts[model] ?? 0) + 1;
  }
  return Object.entries(counts).map(([model, count]) => ({ model, count: count! }));
};

export const formatHostLabel = ({ machine, cpus }: HostInfo): string => {
  const entries = countCpuModels(cpus).map(({ model, count }) => (count === 1 ? model : `${count}x ${model}`));
  return entries.length > 0 ? `${machine} / ${entries.join(', ')}` : machine;
};
