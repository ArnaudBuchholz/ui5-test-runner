import { FileSystem, Host, Http, Path, logger } from '../../platform/index.js';
import { isExcludedPath } from './IDocument.js';
import type { IDocument } from './IDocument.js';

const REPO = 'ArnaudBuchholz/ui5-test-runner';
const BRANCH = 'main';
const DOCS_PATH = 'docs';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const API_BASE = `https://api.github.com/repos/${REPO}`;
const CACHE_FILE_NAME = 'ui5-test-runner-mcp-kb-cache.json';
const ONE_HOUR_MS = 60 * 60 * 1000;

interface ICacheFile {
  treeSha: string;
  checkedAt: number;
  files: Record<string, string>; // docs-relative path → file SHA
}

interface IGitTree {
  sha: string;
  tree: { path: string; type: string; sha: string }[];
}

interface ITreeEntry {
  path: string;
  sha: string;
}

const cacheFilePath = (): string => Path.join(Host.tmpdir(), CACHE_FILE_NAME);

const loadCache = async (): Promise<ICacheFile | null> => {
  try {
    const raw = await FileSystem.readFile(cacheFilePath(), 'utf8');
    return JSON.parse(raw) as ICacheFile;
  } catch {
    return null;
  }
};

const saveCache = (cache: ICacheFile): void => {
  FileSystem.writeFileSync(cacheFilePath(), JSON.stringify(cache));
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

// In-memory content cache keyed by docs-relative path. Survives for the process lifetime.
const _contentCache = new Map<string, string>();

const fetchMissingContent = async (paths: string[]): Promise<void> => {
  const missing = paths.filter((p) => !_contentCache.has(p));
  await Promise.all(
    missing.map(async (p) => {
      _contentCache.set(p, await fetchFileContent(p));
    })
  );
};

const buildDocuments = (paths: string[]): IDocument[] =>
  paths.map((path) => ({ path, content: _contentCache.get(path) ?? '' }));

export const collectRemoteDocuments = async (): Promise<IDocument[]> => {
  const cache = await loadCache();
  const now = Date.now();

  if (cache !== null && now - cache.checkedAt < ONE_HOUR_MS) {
    logger.debug({ source: 'mcp', message: 'using cached remote KB (within 1-hour window)' });
    const paths = Object.keys(cache.files);
    await fetchMissingContent(paths);
    return buildDocuments(paths);
  }

  logger.debug({ source: 'mcp', message: 'checking remote tree SHA' });
  let treeResult: { treeSha: string; entries: ITreeEntry[] };
  try {
    treeResult = await fetchTreeSha();
  } catch (error) {
    if (cache !== null) {
      logger.warn({ source: 'mcp', message: 'could not reach GitHub, using cached KB', error });
      const paths = Object.keys(cache.files);
      await fetchMissingContent(paths);
      return buildDocuments(paths);
    }
    throw new Error('Failed to fetch knowledge base from GitHub and no local cache is available', { cause: error });
  }

  const { treeSha, entries } = treeResult;

  if (cache !== null && treeSha === cache.treeSha) {
    logger.debug({ source: 'mcp', message: 'remote tree SHA unchanged' });
    saveCache({ ...cache, checkedAt: now });
    const paths = Object.keys(cache.files);
    await fetchMissingContent(paths);
    return buildDocuments(paths);
  }

  logger.debug({ source: 'mcp', message: 'remote tree SHA changed, fetching updates' });

  const previousFiles: Record<string, string> = cache?.files ?? {};
  const newFiles: Record<string, string> = {};

  for (const entry of entries) {
    newFiles[entry.path] = entry.sha;
  }

  // Evict content for removed files.
  for (const key of Object.keys(previousFiles)) {
    if (newFiles[key] === undefined) {
      _contentCache.delete(key);
    }
  }

  // Fetch content for new/changed files (different SHA or not yet in memory cache).
  const toFetch = entries.filter((entry) => previousFiles[entry.path] !== entry.sha || !_contentCache.has(entry.path));
  await Promise.all(
    toFetch.map(async (entry) => {
      _contentCache.set(entry.path, await fetchFileContent(entry.path));
    })
  );

  saveCache({ treeSha, checkedAt: now, files: newFiles });
  return buildDocuments(Object.keys(newFiles));
};
