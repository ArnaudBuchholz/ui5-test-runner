import '@ui5/webcomponents/dist/Title.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Panel.js';
import '@ui5/webcomponents/dist/Tag.js';
import '@ui5/webcomponents/dist/Select.js';
import '@ui5/webcomponents/dist/Option.js';
import '@ui5/webcomponents/dist/Input.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Icon.js';
import '@ui5/webcomponents/dist/SegmentedButton.js';
import '@ui5/webcomponents/dist/SegmentedButtonItem.js';
import '@ui5/webcomponents/dist/ToggleButton.js';
import '@ui5/webcomponents/dist/MessageStrip.js';
import '@ui5/webcomponents/dist/Popover.js';
import '@ui5/webcomponents/dist/Tree.js';
import '@ui5/webcomponents/dist/TreeItem.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-down-arrow.js';
import '@ui5/webcomponents-icons/dist/open-folder.js';
import '@ui5/webcomponents-icons/dist/sort-ascending.js';
import '@ui5/webcomponents-icons/dist/sort-descending.js';

import './style.css';

import { getState, setState, subscribe } from './state.js';
import { renderSummary } from './components/Summary.js';
import { renderFilterBar } from './components/FilterBar.js';
import { renderTestList } from './components/TestList.js';
import { validateCtrf } from './utils/ctrf.js';
import { loadStateFromHash } from './utils/url.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';

interface UI5SelectEvent extends Event {
  target: EventTarget & {
    selectedOption: {
      value: string;
      textContent: string;
    };
  };
}

interface UI5InputEvent extends Event {
  target: EventTarget & {
    value: string;
  };
}

interface UI5SegmentedButtonEvent extends Event {
  detail: {
    selectedItems: {
      dataset: {
        sort: 'name' | 'status' | 'duration' | 'none';
      };
    }[];
  };
}

interface UI5TreeSelectionEvent extends Event {
  detail: {
    selectedItems: {
      text: string;
      dataset: {
        value?: string;
      };
    }[];
  };
}

interface UI5TreeItemClickEvent extends Event {
  detail: {
    item: {
      text: string;
      dataset: {
        value?: string;
      };
      selected: boolean;
    };
  };
}

interface GlobalWithCtrf {
  ctrf?: unknown;
}

interface UI5ElementWithShadowRoot extends HTMLElement {
  shadowRoot: ShadowRoot;
}

interface UI5Input extends UI5ElementWithShadowRoot {
  focus: (options?: FocusOptions) => void;
}

function attachEvents() {
  const suiteFilterInput = document.querySelector('#suiteFilterInput');
  const suitePopover = document.querySelector('#suitePopover');
  const suiteTree = document.querySelector('#suiteTree');

  suiteFilterInput?.addEventListener('click', () => {
    if (suitePopover && suiteFilterInput) {
      (suitePopover as unknown as Record<string, unknown>).opener = suiteFilterInput;
      (suitePopover as unknown as Record<string, unknown>).open = true;
    }
  });

  suiteTree?.addEventListener('selection-change', (event: Event) => {
    const treeEvent = event as unknown as UI5TreeSelectionEvent;
    const selectedItem = treeEvent.detail.selectedItems[0];
    if (selectedItem) {
      const value = selectedItem.dataset.value || '';
      setState({ filters: { ...getState().filters, suite: value } });
      if (suitePopover) {
        (suitePopover as unknown as Record<string, unknown>).open = false;
      }
    }
  });

  suiteTree?.addEventListener('item-click', (event: Event) => {
    const clickEvent = event as unknown as UI5TreeItemClickEvent;
    const item = clickEvent.detail.item;
    const value = item.dataset.value || '';
    setState({ filters: { ...getState().filters, suite: value } });
    if (suitePopover) {
      (suitePopover as unknown as Record<string, unknown>).open = false;
    }
  });

  const statusFilter = document.querySelector('#statusFilter');
  statusFilter?.addEventListener('change', (event: Event) => {
    const selectEvent = event as UI5SelectEvent;
    setState({
      filters: {
        ...getState().filters,
        status:
          selectEvent.target.selectedOption.textContent === 'All Statuses'
            ? ''
            : selectEvent.target.selectedOption.textContent
      }
    });
  });

  const searchFilter = document.querySelector('#searchFilter');
  searchFilter?.addEventListener('input', (event: Event) => {
    const inputEvent = event as UI5InputEvent;
    setState({ filters: { ...getState().filters, search: inputEvent.target.value } });
  });

  const sortCriteria = document.querySelector('#sortCriteria');
  sortCriteria?.addEventListener('selection-change', (event: Event) => {
    const segmentedEvent = event as unknown as UI5SegmentedButtonEvent;
    const criteria = segmentedEvent.detail.selectedItems[0].dataset.sort;
    setState({ sort: { ...getState().sort, criteria } });
  });

  const sortOrder = document.querySelector('#sortOrder');
  sortOrder?.addEventListener('click', () => {
    if (sortOrder) {
      setState({ sort: { ...getState().sort, order: sortOrder.pressed ? 'desc' : 'asc' } });
    }
  });

  const openButton = document.querySelector('#openBtn');
  openButton?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        file
          .text()
          .then((text) => {
            let json: unknown;
            try {
              json = JSON.parse(text);
            } catch {
              setState({ invalidReport: true });
              return;
            }
            if (validateCtrf(json)) {
              setState({ report: json as CommonTestReport, invalidReport: false });
            } else {
              setState({ report: json as CommonTestReport, invalidReport: true });
            }
          })
          .catch(() => {
            setState({ invalidReport: true });
          });
      }
    });
    input.click();
  });

  for (const header of document.querySelectorAll('.test-item-header')) {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const details = item?.querySelector('.test-details');
      const icon = header.querySelector('ui5-icon');
      if (details && icon) {
        const isExpanded = details.classList.contains('expanded');
        if (isExpanded) {
          details.classList.remove('expanded');
          icon.name = 'navigation-right-arrow';
        } else {
          details.classList.add('expanded');
          icon.name = 'navigation-down-arrow';
        }
      }
    });
  }

  for (const breadcrumb of document.querySelectorAll('.suite-breadcrumb')) {
    breadcrumb.addEventListener('click', (event) => {
      event.stopPropagation();
      const suite = breadcrumb.getAttribute('title');
      if (suite) {
        setState({ filters: { ...getState().filters, suite } });
      }
    });
  }
}

function render() {
  const state = getState();
  const app = document.querySelector('#app');
  if (!app) {
    return;
  }

  // Save focus and selection
  const activeElement = document.activeElement as HTMLElement | null;
  const activeId = activeElement?.id;
  let selectionStart: number | null = null;
  let selectionEnd: number | null = null;

  if (activeElement && (activeElement instanceof HTMLInputElement || activeElement.tagName === 'UI5-INPUT')) {
    const input = activeElement as HTMLInputElement | UI5Input;
    const innerInput = 'shadowRoot' in input ? input.shadowRoot.querySelector('input') : input;
    if (innerInput) {
      selectionStart = innerInput.selectionStart;
      selectionEnd = innerInput.selectionEnd;
    }
  }

  let html = '';
  if (state.invalidReport) {
    html += `<ui5-message-strip design="Negative" style="margin-bottom: 1rem;">The report appears to be invalid</ui5-message-strip>`;
  }

  if (state.report) {
    html += renderSummary(state);
    html += renderFilterBar(state);
    html += renderTestList(state);
  } else {
    html += `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
                <ui5-title>UI5 Test Runner Report</ui5-title>
                <p>Please open a CTRF report file to begin.</p>
                <ui5-button id="openBtn" icon="open-folder">Open Report</ui5-button>
            </div>
        `;
  }

  app.innerHTML = html;
  attachEvents();

  // Restore focus and selection
  if (activeId) {
    const newElement = document.querySelector(`#${activeId}`);
    if (newElement) {
      // Small delay to ensure Web Components are ready
      requestAnimationFrame(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        newElement.focus();
        if (selectionStart !== null && selectionEnd !== null) {
          const innerInput = newElement.shadowRoot?.querySelector('input');
          if (innerInput) {
            innerInput.setSelectionRange(selectionStart, selectionEnd);
          }
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStateFromHash(getState());

  const globalCtrf = (globalThis as unknown as GlobalWithCtrf).ctrf;
  if (globalCtrf) {
    if (validateCtrf(globalCtrf)) {
      setState({ report: globalCtrf });
    } else {
      setState({ report: globalCtrf as CommonTestReport, invalidReport: true });
    }
  }

  subscribe(render);
});

globalThis.addEventListener('hashchange', () => {
  loadStateFromHash(getState());
  render();
});
