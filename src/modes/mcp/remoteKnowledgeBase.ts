import { FileSystem, Host, Http, Path, logger } from '../../platform/index.js';
import { isExcludedPath } from './IDocument.js';
import type { IDocument } from './IDocument.js';

const REPO = 'ArnaudBuchholz/ui5-test-runner';
const BRANCH = 'main';
const DOCS_PATH = 'docs';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const API_BASE = `https://api.github.com/repos/${REPO}`;
const CACHE_FILE_NAME = 'ui5-test-runner-mcp-kb-cache.json';
const CACHE_FILE_PATH = Path.join(Host.tmpdir(), CACHE_FILE_NAME);
const ONE_HOUR_MS = 60 * 60 * 1000;

interface ICacheFile {
  treeSha: string;
  checkedAt: number;
  files: Record<string, string>; // docs-relative path → file SHA
  contents: Record<string, string>; // docs-relative path → file content
}

interface IGitTree {
  sha: string;
  tree: { path: string; type: string; sha: string }[];
}

interface ITreeEntry {
  path: string;
  sha: string;
}

const loadCache = async (): Promise<ICacheFile | null> => {
  try {
    const raw = await FileSystem.readFile(CACHE_FILE_PATH, 'utf8');
    return JSON.parse(raw) as ICacheFile;
  } catch {
    return null;
  }
};

const saveCache = (cache: ICacheFile): void => {
  FileSystem.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache));
};

const fetchTreeSha = async (): Promise<{ treeSha: string; entries: ITreeEntry[] }> => {
  const url = `${API_BASE}/git/trees/${BRANCH}?recursive=1`;
  const text = await Http.getAsText(url);
  const tree = JSON.parse(text) as IGitTree;
  const entries = tree.tree
    .filter(
      (entry) =>
        entry.type === 'blob' &&
        entry.path.startsWith(`${DOCS_PATH}/`) &&
        entry.path.endsWith('.md') &&
        !isExcludedPath(entry.path.slice(DOCS_PATH.length + 1))
    )
    .map((entry) => ({ path: entry.path.slice(DOCS_PATH.length + 1), sha: entry.sha }));
  return { treeSha: tree.sha, entries };
};

const fetchFileContent = async (relativePath: string): Promise<string> =>
  Http.getAsText(`${RAW_BASE}/${DOCS_PATH}/${relativePath}`);

const buildDocuments = (contents: Record<string, string>): IDocument[] =>
  Object.entries(contents).map(([path, content]) => ({ path, content }));

export const collectRemoteDocuments = async (): Promise<IDocument[]> => {
  logger.info({ source: 'mcp', message: `cache path: ${CACHE_FILE_PATH}`});

  const cache = await loadCache();
  const now = Date.now();

  if (cache !== null && now - cache.checkedAt < ONE_HOUR_MS) {
    logger.info({ source: 'mcp', message: 'using cached remote KB (within 1-hour window)' });
    return buildDocuments(cache.contents);
  }

  logger.debug({ source: 'mcp', message: 'checking remote tree SHA' });
  let treeResult: { treeSha: string; entries: ITreeEntry[] };
  try {
    treeResult = await fetchTreeSha();
  } catch (error) {
    if (cache !== null) {
      logger.warn({ source: 'mcp', message: 'could not reach GitHub, using cached KB', error });
      return buildDocuments(cache.contents);
    }
    throw new Error('Failed to fetch knowledge base from GitHub and no local cache is available', { cause: error });
  }

  const { treeSha, entries } = treeResult;

  if (cache !== null && treeSha === cache.treeSha) {
    logger.info({ source: 'mcp', message: 'remote tree SHA unchanged' });
    saveCache({ ...cache, checkedAt: now });
    return buildDocuments(cache.contents);
  }

  logger.info({ source: 'mcp', message: 'remote tree SHA changed, fetching updates' });

  const previousContents: Record<string, string> = cache?.contents ?? {};
  const previousFiles: Record<string, string> = cache?.files ?? {};
  const newFiles: Record<string, string> = {};
  const newContents: Record<string, string> = {};

  for (const entry of entries) {
    newFiles[entry.path] = entry.sha;
  }

  await Promise.all(
    entries.map(async (entry) => {
      if (previousFiles[entry.path] === entry.sha && previousContents[entry.path] !== undefined) {
        newContents[entry.path] = previousContents[entry.path]!;
      } else {
        newContents[entry.path] = await fetchFileContent(entry.path);
      }
    })
  );

  saveCache({ treeSha, checkedAt: now, files: newFiles, contents: newContents });
  return buildDocuments(newContents);
};
