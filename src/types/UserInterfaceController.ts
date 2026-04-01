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
  connect(handler: (event: Partial<State>) => void): { initialState: State; settings: Settings; };
  interaction(event: UIEvent<State, Actions>): void;
};
