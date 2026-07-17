import { machine, cpus, platform, release, version, homedir } from 'node:os';

export class Host {
  static readonly argv = process.argv;
  static readonly cpus = cpus;
  static readonly cwd = process.cwd.bind(process);
  static readonly env = process.env;
  static readonly homedir = homedir;
  static readonly machine = machine;
  static readonly memoryUsage = process.memoryUsage.bind(process);
  static readonly nodeVersion = process.version;
  static readonly osRelease = release;
  static readonly osVersion = version;
  static readonly pid = process.pid;
  static readonly platform = platform;
  static readonly version = process.version;
}
