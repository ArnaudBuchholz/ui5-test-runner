import { it, expect, describe, vi } from 'vitest';
import { Command } from './Command.js';
import type { Configuration } from './configuration/Configuration.js';
import { Npm } from './Npm.js';

const EMPTY_CONFIGURATION = {} as Configuration;

describe('Command.split', () => {
  it('split the command on spaces', () => {
    expect(Command.split('npm run test')).toStrictEqual(['npm', 'run', 'test']);
  });

  it("supports quotes (')", () => {
    expect(Command.split("node 'test script'")).toStrictEqual(['node', 'test script']);
  });

  it('supports quotes (")', () => {
    expect(Command.split('node "test script"')).toStrictEqual(['node', 'test script']);
  });

  it('supports mixing quotes (even if not recommended)', () => {
    expect(Command.split('node "test \' script" \'test " script\'')).toStrictEqual([
      'node',
      "test ' script",
      'test " script'
    ]);
  });

  it('supports orphan quotes', () => {
    expect(Command.split('node "test \'script')).toStrictEqual(['node', '"test', "'script"]);
  });
});

describe('Command.parse', () => {
  it('splits the command', async () => {
    await expect(Command.parse(EMPTY_CONFIGURATION, 'bash test')).resolves.toStrictEqual(['bash', ['test']]);
  });

  it('splits the command (using node)', async () => {
    await expect(Command.parse(EMPTY_CONFIGURATION, 'node test')).resolves.toStrictEqual(['node', ['test']]);
  });

  it('replaces npm with node and npm cli path', async () => {
    vi.spyOn(Npm, 'getCliPath').mockResolvedValue('npm_cli.js');
    await expect(Command.parse(EMPTY_CONFIGURATION, 'npm run test')).resolves.toStrictEqual([
      'node',
      ['npm_cli.js', 'run', 'test']
    ]);
  });
});
