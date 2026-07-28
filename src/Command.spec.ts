import { it, expect, describe, vi } from 'vitest';
import { Command } from './Command.js';
import type { Configuration } from './configuration/Configuration.js';
import { Npm } from './Npm.js';

const TEST_CONFIGURATION = {
  cwd: '/home/usr',
  reportDir: '/home/usr/report'
} as Configuration;

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
    await expect(Command.parse(TEST_CONFIGURATION, 'bash test')).resolves.toStrictEqual(['bash', ['test'], {}]);
  });

  it('splits the command (using node)', async () => {
    await expect(Command.parse(TEST_CONFIGURATION, 'node test')).resolves.toStrictEqual(['node', ['test'], {}]);
  });

  it('replaces npm with node and npm cli path', async () => {
    vi.spyOn(Npm, 'getCliPath').mockResolvedValue('npm_cli.js');
    await expect(Command.parse(TEST_CONFIGURATION, 'npm run test')).resolves.toStrictEqual([
      'node',
      ['npm_cli.js', 'run', 'test'],
      {}
    ]);
  });

  describe('parameter substitution', () => {
    it('replaces a parameter with its equivalent in config', async () => {
      await expect(Command.parse(TEST_CONFIGURATION, 'npm run test -- {{reportDir}}')).resolves.toStrictEqual([
        'node',
        ['npm_cli.js', 'run', 'test', '--', '/home/usr/report'],
        {}
      ]);
    });

    it('fails if trying to use an known a parameter', async () => {
      await expect(Command.parse(TEST_CONFIGURATION, 'npm run test -- {{reportDi}}')).rejects.toThrow(
        'Invalid command line substitution parameter: reportDi'
      );
    });
  });

  describe('extras substitution', () => {
    it('replaces a parameter with its value from extras', async () => {
      await expect(
        Command.parse(TEST_CONFIGURATION, 'node test.ts {{exitCode}}', { exitCode: '42' })
      ).resolves.toStrictEqual(['node', ['test.ts', '42'], {}]);
    });

    it('extras take precedence over configuration', async () => {
      await expect(
        Command.parse(TEST_CONFIGURATION, 'node test.ts {{reportDir}}', { reportDir: '/override' })
      ).resolves.toStrictEqual(['node', ['test.ts', '/override'], {}]);
    });

    it('supports extras substitution in env var values', async () => {
      await expect(
        Command.parse(TEST_CONFIGURATION, 'CODE={{exitCode}} node test.ts', { exitCode: '1' })
      ).resolves.toStrictEqual(['node', ['test.ts'], { CODE: '1' }]);
    });

    it('fails if the parameter is neither in extras nor in configuration', async () => {
      await expect(Command.parse(TEST_CONFIGURATION, 'node test.ts {{unknown}}', {})).rejects.toThrow(
        'Invalid command line substitution parameter: unknown'
      );
    });
  });

  describe('script resolution', () => {
    const PACKAGE_SCRIPTS = ['build', 'test'];

    it('runs a matching script via npm run', async () => {
      vi.spyOn(Npm, 'listPackageScriptNames').mockResolvedValue(PACKAGE_SCRIPTS);
      vi.spyOn(Npm, 'getCliPath').mockResolvedValue('npm_cli.js');
      await expect(Command.parse(TEST_CONFIGURATION, 'build')).resolves.toStrictEqual([
        'node',
        ['npm_cli.js', 'run', 'build'],
        {}
      ]);
    });

    it('passes extra parameters after the script name', async () => {
      vi.spyOn(Npm, 'listPackageScriptNames').mockResolvedValue(PACKAGE_SCRIPTS);
      vi.spyOn(Npm, 'getCliPath').mockResolvedValue('npm_cli.js');
      await expect(Command.parse(TEST_CONFIGURATION, 'test -- --reporter=verbose')).resolves.toStrictEqual([
        'node',
        ['npm_cli.js', 'run', 'test', '--', '--reporter=verbose'],
        {}
      ]);
    });

    it('falls back to executable when no package.json is found', async () => {
      vi.spyOn(Npm, 'listPackageScriptNames').mockResolvedValue([]);
      await expect(Command.parse(TEST_CONFIGURATION, 'mybinary')).resolves.toStrictEqual(['mybinary', [], {}]);
    });

    it('falls back to executable when script is not in package.json', async () => {
      vi.spyOn(Npm, 'listPackageScriptNames').mockResolvedValue(PACKAGE_SCRIPTS);
      await expect(Command.parse(TEST_CONFIGURATION, 'unknown-script')).resolves.toStrictEqual([
        'unknown-script',
        [],
        {}
      ]);
    });
  });

  describe('environment variables', () => {
    it('extracts a single env var before the command', async () => {
      await expect(Command.parse(TEST_CONFIGURATION, 'TEST=yes node test.ts')).resolves.toStrictEqual([
        'node',
        ['test.ts'],
        { TEST: 'yes' }
      ]);
    });

    it('extracts multiple env vars before the command', async () => {
      await expect(Command.parse(TEST_CONFIGURATION, 'A=1 B=2 node test.ts')).resolves.toStrictEqual([
        'node',
        ['test.ts'],
        { A: '1', B: '2' }
      ]);
    });

    it('supports substitution in env var values', async () => {
      await expect(Command.parse(TEST_CONFIGURATION, 'TEST={{reportDir}} node test.ts')).resolves.toStrictEqual([
        'node',
        ['test.ts'],
        { TEST: '/home/usr/report' }
      ]);
    });

    it('fails if substitution in env var value uses an unknown parameter', async () => {
      await expect(Command.parse(TEST_CONFIGURATION, 'TEST={{reportDi}} node test.ts')).rejects.toThrow(
        'Invalid command line substitution parameter: reportDi'
      );
    });

    it('supports an env var value containing an = sign', async () => {
      await expect(Command.parse(TEST_CONFIGURATION, 'TEST=a=b node test.ts')).resolves.toStrictEqual([
        'node',
        ['test.ts'],
        { TEST: 'a=b' }
      ]);
    });
  });
});
