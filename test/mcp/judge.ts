import { loadProvider } from './provider.js';
import { Harness  } from './Harness.js';
import type {Emit} from './Harness.js';

export interface CriterionVerdict {
  name: string;
  criterion: string;
  pass: boolean;
  rationale: string;
}

export interface JudgeResult {
  verdicts: CriterionVerdict[];
  passed: boolean;
  inputTokens: number;
  outputTokens: number;
}

export const JUDGE_ENV_VAR = 'JUDGE_OPENAI_CONFIG';

const SYSTEM_PROMPT = `You are a strict evaluator. You are given a user question, an
assistant's answer, and a set of named criteria the answer is expected to satisfy. For
each criterion, decide whether the answer satisfies it. Be literal: a criterion is only
met if the answer actually contains what it asks for. Respond with a single JSON object
whose keys are the criterion names and whose values are objects { "pass": boolean,
"rationale": string }. Output JSON only, no prose.`;

function buildUserPrompt(question: string, answer: string, expected: Record<string, string>): string {
  const criteria = Object.entries(expected)
    .map(([name, criterion]) => `- ${name}: ${criterion}`)
    .join('\n');
  return [
    `# Question\n${question}`,
    `# Answer\n${answer}`,
    `# Criteria\n${criteria}`,
    `Return JSON keyed by the criterion names: ${Object.keys(expected).join(', ')}.`
  ].join('\n\n');
}

interface RawVerdict {
  pass?: unknown;
  rationale?: unknown;
}

function parseVerdicts(content: string, expected: Record<string, string>): CriterionVerdict[] {
  // The model may wrap JSON in a ```json fence — extract the first {...last} block.
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error(`Judge did not return JSON: ${content}`);
  }
  const parsed = JSON.parse(content.slice(start, end + 1)) as Record<string, RawVerdict>;
  return Object.entries(expected).map(([name, criterion]) => {
    const raw = parsed[name];
    return {
      name,
      criterion,
      pass: raw?.pass === true,
      rationale: typeof raw?.rationale === 'string' ? raw.rationale : '(no rationale returned)'
    };
  });
}

export async function judge(
  question: string,
  answer: string,
  expected: Record<string, string>,
  emit: Emit
): Promise<JudgeResult> {
  const provider = loadProvider(JUDGE_ENV_VAR);
  const harness = new Harness({ provider, emit });

  const content = await harness.ask([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(question, answer, expected) }
  ]);

  const verdicts = parseVerdicts(content, expected);
  return {
    verdicts,
    passed: verdicts.every((v) => v.pass),
    inputTokens: harness.inputTokens,
    outputTokens: harness.outputTokens
  };
}
