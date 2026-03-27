import type { FilterField } from '../filterHelpers.js';
import { buildIncludeFilter, buildExcludeFilter } from '../filterHelpers.js';
import { levelToString } from '../apiClient.js';

export interface CellAction {
  label: string;
  expression: string;
}

export function buildCellActions(field: FilterField, rawValue: string | number): CellAction[] {
  const displayValue = field === 'level' ? levelToString(Number(rawValue)) : String(rawValue);

  const include = buildIncludeFilter(field, rawValue);
  const exclude = buildExcludeFilter(field, rawValue);

  const actions: CellAction[] = [
    { label: `Include: ${field} = "${displayValue}"`, expression: include },
    { label: `Exclude: ${field} ≠ "${displayValue}"`, expression: exclude }
  ];

  if (field === 'message' && typeof rawValue === 'string' && rawValue.includes(' ')) {
    const words = rawValue.split(' ').slice(0, 3).join(' ');
    actions.push({
      label: `Include messages containing "${words}..."`,
      expression: buildIncludeFilter('message', words)
    });
  }

  return actions;
}

export function renderCellContextMenu(actions: CellAction[]): string {
  const items = actions
    .map(
      (a) =>
        `<div class="context-menu__item" data-expression="${a.expression.replaceAll('"', '&quot;')}">${a.label}</div>`
    )
    .join('');

  return `<div id="cellContextMenu" class="context-menu">${items}</div>`;
}
