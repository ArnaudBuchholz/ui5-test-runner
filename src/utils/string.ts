export function split(string: string): [string];
export function split<T extends number[]>(s: string, ...lengths: T): [...{ [K in keyof T]: string }, string?];
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
