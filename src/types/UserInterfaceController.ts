import type { Writable } from './typeUtilities.js';

export type UISelectableItem<KEY_TYPE extends string | number> = {
  label: string;
  key: KEY_TYPE;
};

/** State changes are processed before executing action */
export type UIEvent<State, Actions> = Partial<Writable<State>> & {
  action?: Actions;
};

export type IUIController<Settings, State, Actions> = {
  /**
   * Connect the UI to the controller.
   * Everytime the control requires an update in the UI, the update callback is called with state values that changed
   *
   * @returns initial state and settings for static values (drop downs)
   */
  connect(update: (event: Partial<State>) => void): { initialState: State; settings: Settings };

  /**
   * Transmits user interaction to the controller by sending values that must change in the state and/or an action that was triggered
   */
  interaction(event: UIEvent<State, Actions>): void;
};
