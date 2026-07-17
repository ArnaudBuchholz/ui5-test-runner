#!/usr/bin/env node

import { Exit, Host } from './platform/index.js';
import { version } from './platform/version.js';
import { CommandLine } from './configuration/CommandLine.js';
import { execute } from './modes/execute.js';
import { evaluateIf } from './if.js';

try {
  const cliVersion = await version();
  const cliName = cliVersion.split('@', 1)[0] ?? 'ui5-test-runner';
  const indexOfCli = Host.argv.findIndex((value) => /[\\/]cli(\.[tj]s)?$/.exec(value) || value.endsWith(cliName));
  const configuration = await CommandLine.buildConfigurationFrom(Host.cwd(), Host.argv.slice(indexOfCli + 1));
  if (await evaluateIf(configuration)) {
    await execute(configuration);
  } else {
    console.log('⚠️ [SKIPIF] Skipping execution (--if)');
    if (Host.env['UI5TR_BATCH_MODE'] && typeof process.send === 'function') {
      process.send({ type: 'skip' });
    }
  }
} catch (error) {
  console.error(error);
  Exit.code = -1;
} finally {
  await Exit.shutdown();
}
