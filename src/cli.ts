#!/usr/bin/env node

import { Exit, Host, logger } from './platform/index.js';
import { version } from './platform/version.js';
import { CommandLine } from './configuration/CommandLine.js';
import { execute } from './modes/execute.js';
import { shouldExecuteIf } from './executeIf.js';

try {
  const cliVersion = await version();
  const cliName = cliVersion.split('@', 1)[0] ?? 'ui5-test-runner';
  const indexOfCli = Host.argv.findIndex((value) => /[\\/]cli(\.[tj]s)?$/.exec(value) || value.endsWith(cliName));
  const configuration = await CommandLine.buildConfigurationFrom(Host.cwd(), Host.argv.slice(indexOfCli + 1));
  if (Host.env['UI5TR_BATCH_MODE']) {
    logger.warn({ source: 'job', message: '⚠️ [BATCHM] Batch mode item execution' });
  }
  if (configuration.if && !shouldExecuteIf(configuration.if)) {
    logger.warn({ source: 'job', message: '⚠️ [SKIPIF] Skipping execution (--if)' });
  } else {
    await execute(configuration);
  }
} catch (error) {
  console.error(error);
  Exit.code = -1;
} finally {
  await Exit.shutdown();
}
