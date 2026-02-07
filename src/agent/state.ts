export const state: Partial<{
  loaded: ReturnType<typeof Date.now>;
  done: true;
  type: 'suite' | 'QUnit';
  pages: string[]; // when type = suite
}> = {};
