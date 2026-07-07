import { it, expect, describe } from 'vitest';
import { parseCommand } from './Command.js';

describe('parseCommand', () => {
  it('split the command on spaces', () => {
    expect(parseCommand('npm run test')).toStrictEqual(['npm', 'run', 'test']);
  });

  it('supports quotes (\')', () => {
    expect(parseCommand('node \'test script\'')).toStrictEqual(['node', 'test script']);
  })

  it('supports quotes (")', () => {
    expect(parseCommand('node "test script"')).toStrictEqual(['node', 'test script']);
  })

  it('supports mixing quotes (even if not recommended)', () => {
    expect(parseCommand('node "test \' script" \'test " script\'')).toStrictEqual(['node', 'test \' script', 'test " script']);
  })

  it('supports orphan quotes', () => {
    expect(parseCommand('node "test \'script')).toStrictEqual(['node', '"test', '\'script']);
  })
});
