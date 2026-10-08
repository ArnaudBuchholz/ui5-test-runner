import { readFileSync } from 'node:fs';
import { parse } from 'smol-toml';

export interface TestCase {
  question: string;
  files: Record<string, string>;
  expected: Record<string, string>;
}

export function loadTestCase(path: string): TestCase {
  const parsed = parse(readFileSync(path, 'utf8')) as {
    user?: { question?: string };
    files?: Record<string, string>;
    expected?: Record<string, string>;
  };

  const question = parsed.user?.question?.trim();
  if (!question) {
    throw new Error(`Test case "${path}" is missing [user].question`);
  }

  return {
    question,
    files: parsed.files ?? {},
    expected: parsed.expected ?? {}
  };
}

