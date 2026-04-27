import { AbstractUserInterfaceController } from '../../utils/AbstractUserInterfaceController.js';
import type { Settings, State, Actions } from './types.js';

export class ReportController
  extends AbstractUserInterfaceController<Settings, State, Actions>
{
  constructor() {
    super();
  }

  protected override _onInteraction(stateDiff: Partial<State>, action?: Actions) {
    if (action !== undefined) {
      void this[action]();
    }
  }

  protected async export() {
  }
}