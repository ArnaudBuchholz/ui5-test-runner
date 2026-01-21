import { machine, cpus, platform } from 'node:os';

export class Host {
  static readonly cpus = cpus;
  static readonly cwd = process.cwd.bind(process);
  static readonly machine = machine;
  static readonly memoryUsage = process.memoryUsage.bind(process);
  static readonly nodeVersion = process.version;
  static readonly pid = process.pid;
  static readonly platform = platform;
}
