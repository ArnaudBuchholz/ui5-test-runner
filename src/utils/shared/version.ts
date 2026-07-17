const parseVersion = (version: string): [number[], (string | number)[]] => {
  const [release, prerelease] = version.split('-');
  if (release) {
    const releaseParts = release.split('.').map(Number);
    const prereleaseParts = prerelease
      ? prerelease.split('.').map((part) => (Number.isNaN(Number(part)) ? part : Number(part)))
      : [];
    return [releaseParts, prereleaseParts];
  }
  return [[], []];
};

/**
 * Compare two semantic versions, including prerelease versions.
 * Examples: "1.2.3", "1.2.3-beta", "1.2.3-rc.1"
 */
export const compareVersions = (version1: string, version2: string): 1 | 0 | -1 => {
  const [v1Release, v1Prerelease] = parseVersion(version1);
  const [v2Release, v2Prerelease] = parseVersion(version2);

  // Pad release parts
  const maxLength = Math.max(v1Release.length, v2Release.length);
  while (v1Release.length < maxLength) {
    v1Release.push(0);
  }
  while (v2Release.length < maxLength) {
    v2Release.push(0);
  }

  // Compare release versions first (lengths are aligned)
  for (let index = 0; index < maxLength; index++) {
    if (v1Release[index]! > v2Release[index]!) return 1;
    if (v1Release[index]! < v2Release[index]!) return -1;
  }

  return comparePreReleases(v1Prerelease, v2Prerelease);
};

const comparePreReleases = (v1Prerelease: (string | number)[], v2Prerelease: (string | number)[]): 1 | 0 | -1 => {
  // If releases are equal, compare prerelease
  // Release versions (no prerelease) are greater than prerelease versions
  if (v1Prerelease.length === 0 && v2Prerelease.length === 0) {
    return 0;
  }
  if (v1Prerelease.length === 0) return 1; // v1 is release, v2 is prerelease
  if (v2Prerelease.length === 0) return -1; // v2 is release, v1 is prerelease

  // Compare prerelease parts
  for (let index = 0; index < Math.max(v1Prerelease.length, v2Prerelease.length); index++) {
    const p1 = v1Prerelease[index] ?? 0;
    const p2 = v2Prerelease[index] ?? 0;

    // Numbers are less than strings in prerelease ordering
    const p1Type = typeof p1;
    const p2Type = typeof p2;

    if (p1Type !== p2Type) {
      return p1Type === 'number' ? -1 : 1;
    }

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
};
