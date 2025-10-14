export const looksLikeAnUrl = (value: string): boolean => !!/^https?:\/\/[^ "]+$/.test(value);
