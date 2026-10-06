import 'dotenv/config';

export interface ProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

const DEFAULT_ENV_VAR = 'TEST_OPENAI_CONFIG';

function fail(message: string): never {
  throw new Error(message);
}

export function loadProvider(environmentVariable: string = DEFAULT_ENV_VAR): ProviderConfig {
  const raw = process.env[environmentVariable];
  if (!raw) {
    fail(`${environmentVariable} is not set. Expected a JSON object { apiKey, baseUrl, model }.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`${environmentVariable} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    fail(`${environmentVariable} must be a JSON object { apiKey, baseUrl, model }.`);
  }

  const { apiKey, baseUrl, model } = parsed as Record<string, unknown>;
  if (typeof apiKey !== 'string' || typeof baseUrl !== 'string' || typeof model !== 'string') {
    fail(`${environmentVariable} must contain string fields apiKey, baseUrl and model.`);
  }

  return { apiKey, baseURL: baseUrl, model };
}
