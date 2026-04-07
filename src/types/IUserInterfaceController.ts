import type { Writable } from './typeUtilities.js';

export type UISelectableItem<KEY_TYPE extends string | number> = {
  label: string;
  key: KEY_TYPE;
};

/** State changes are processed before executing action */
export type UIEvent<State, Actions> = Partial<Writable<State>> & {
  action?: Actions;
};

export type IUserInterfaceController<Settings extends object, State extends object, Actions extends string> = {
  /**
   * Contains the up-to-date state.
   *
   * NOTE: Can be updated through calls to interaction
   */
  readonly state: Readonly<State>;

  readonly settings: Readonly<Settings>;

  /**
   * Connect the UI to the controller.
   * Everytime the control requires an update in the UI, the update callback is called with state values that changed.
   */
  connect(update: (event: Partial<State>) => void): void;

  /**
   * Transmits user interaction to the controller by sending values that must change in the state and/or an action that was triggered.
   *
   * NOTE: The UI should optimistically assume the controller accepts the change. The UI MUST send only the changed fields
   * in the UIEvent payload. The controller only calls the update(...) callback when it needs to correct or reject a change —
   * i.e., to restore previous values or to surface validation errors. If the controller accepts the change, it does not need
   * to call update(...) to confirm.
   */
  interaction(event: UIEvent<State, Actions>): void;
};
