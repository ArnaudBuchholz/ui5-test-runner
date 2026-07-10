import { machine, cpus, platform, homedir } from 'node:os';

export class Host {
  static readonly argv = process.argv;
  static readonly cpus = cpus;
  static readonly cwd = process.cwd.bind(process);
  static readonly homedir = homedir;
  static readonly machine = machine;
  static readonly memoryUsage = process.memoryUsage.bind(process);
  static readonly nodeVersion = process.version;
  static readonly pid = process.pid;
  static readonly platform = platform;
}
