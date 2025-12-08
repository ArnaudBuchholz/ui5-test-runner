import { workerData } from 'node:worker_threads';

const main = async () => {
  const { path, data } = workerData as { path: string; data: unknown };
  const { workerMain } = (await import(path)) as { workerMain: (data: unknown) => void };
  workerMain(data);
};

void main();
