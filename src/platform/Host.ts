import { machine, cpus } from 'node:os';

export class Host {
  static readonly cpus = cpus;
  static readonly cwd = process.cwd.bind(process);
  static readonly machine = machine;
  static readonly memoryUsage = process.memoryUsage.bind(process);
  static readonly nodeVersion = process.version;
  static readonly pid = process.pid;
  static readonly setExitCode = (code: number) => {
    process.exitCode = code;
  };
  static readonly threadCpuUsage = process.threadCpuUsage.bind(process);
}
