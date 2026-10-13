export interface IDocument {
  readonly path: string;
  readonly content: string;
}

const EXCLUDED_FOLDERS = ['adr', 'decks', 'prompts'] as const;

export const isExcludedPath = (documentationRelativePath: string): boolean =>
  EXCLUDED_FOLDERS.some((folder) => documentationRelativePath.startsWith(`${folder}/`));
