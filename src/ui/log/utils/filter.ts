export function buildFilterExpression(
  field: string,
  value: unknown,
  op: '===' | '!==',
  existingFilter: string
): string {
  const formatted = typeof value === 'string' ? `"${value}"` : String(value);
  const expression = `${field} ${op} ${formatted}`;
  if (!existingFilter) {
    return expression;
  }
  return `${existingFilter} && ${expression}`;
}
