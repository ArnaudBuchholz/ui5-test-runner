#!/usr/bin/env node

import { CommandLine } from './configuration/CommandLine.js';
import { Platform } from './Platform.js';
import { execute } from './job.js';

const indexOfCli = process.argv.findIndex((value) => value.endsWith('cli.ts') || value.endsWith('cli.js'));
const configuration = await CommandLine.buildConfigurationFrom(Platform.cwd(), process.argv.slice(indexOfCli + 1));
await execute(configuration);
