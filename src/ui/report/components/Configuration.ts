import type { State } from '../../../reports/ui/types.js';

export function renderConfiguration(state: State): string {
  const configuration = state.report.extra?.['configuration'];
  if (!configuration) return '';
  return `<ui5-panel id="configPanel" collapsed no-animation="true">
  <div slot="header" class="panel-header">
    <ui5-title level="H4">Configuration</ui5-title>
  </div>
  <div class="config-body">
    <pre class="config-json">${JSON.stringify(configuration, null, 2)}</pre>
  </div>
</ui5-panel>`;
}
