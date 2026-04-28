export function split(string: string): [string];
export function split<T extends number[]>(s: string, ...lengths: T): [...{ [K in keyof T]: string }, string];
export function split(string: string, ...lengthes: number[]): string[] {
  const result: string[] = [];
  let from = 0;
  for (const length of lengthes) {
    result.push(string.slice(from, from + length));
    from += length;
  }
  if (from < string.length) {
    result.push(string.slice(from));
  }
  return result;
}

export const formatDuration = (ms: number): string => {
  if (ms <= 0) {
    return '00:00';
  }
  if (ms < 1000) {
    return '0.' + ms.toString().padStart(3, '0');
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes.toString().padStart(2, '0') + ':' + (seconds % 60).toString().padStart(2, '0');
};
