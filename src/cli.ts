#!/usr/bin/env node

import { Exit, Host } from './platform/index.js';
import { version } from './platform/version.js';
import { CommandLine } from './configuration/CommandLine.js';
import { execute } from './modes/execute.js';

const main = async () => {
  const cliVersion = await version();
  const cliName = cliVersion.split('@', 1)[0] ?? 'ui5-test-runner';
  const indexOfCli = process.argv.findIndex((value) => /[\\/]cli(\.[tj]s)?$/.exec(value) || value.endsWith(cliName));
  const configuration = await CommandLine.buildConfigurationFrom(Host.cwd(), process.argv.slice(indexOfCli + 1));
  await execute(configuration);
};

main()
  .catch((error) => {
    console.error(error);
    Exit.code = -1;
  })
  .finally(async () => {
    await Exit.shutdown();
  });
