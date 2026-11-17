import type { State } from '../../../reports/ui/types.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export function renderConfiguration(state: State): string {
  const configuration = state.report.extra?.['configuration'];
  if (!configuration) {
    return '';
  }
  const json = escapeHtml(JSON.stringify(configuration, null, 2));
  return `<section class="config" id="configPanel">
  <button class="config__toggle" id="configToggle" aria-expanded="false">▸ Configuration</button>
  <pre class="config__json" id="configJson" style="display:none">${json}</pre>
</section>`;
}
