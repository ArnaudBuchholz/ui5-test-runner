#!/usr/bin/env node

import { Exit, Host } from './system/index.js';
import { CommandLine } from './configuration/CommandLine.js';
import { execute } from './job.js';

const main = async () => {
  const indexOfCli = process.argv.findIndex((value) => value.endsWith('cli.ts') || value.endsWith('cli.js'));
  const configuration = await CommandLine.buildConfigurationFrom(Host.cwd(), process.argv.slice(indexOfCli + 1));
  await execute(configuration);
};

main()
  .catch((error) => {
    console.error(error);
    Exit.code = -1;
  })
  .finally(async () => {
    await Exit.shutddown();
  });
