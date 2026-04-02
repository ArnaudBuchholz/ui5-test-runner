import type { Writable } from './typeUtilities.js';

export type UISelectableItem<KEY_TYPE extends string | number> = {
  label: string;
  key: KEY_TYPE;
};

/** State changes are processed before executing action */
export type UIEvent<State, Actions> = Partial<Writable<State>> & {
  action?: Actions;
};

export type IUIController<Settings extends object, State extends object, Actions extends string> = {
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

export abstract class AbstractUIController<
  Settings extends object,
  State extends object,
  Actions extends string
> implements IUIController<Settings, State, Actions> {
  protected _state = {} as State;
  protected _settings = {} as Settings;
  protected _updateCb: (event: Partial<State>) => void = () => {};

  protected _assign({ ...stateDiff }: Partial<State>): Partial<State> {
    for (const key of Object.keys(stateDiff) as (keyof State)[]) {
      if (stateDiff[key] === this._state[key]) {
        delete stateDiff[key];
      }
    }
    Object.assign(this._state, stateDiff);
    return stateDiff;
  }

  protected _update(stateDiff: Partial<State>): Partial<State> {
    stateDiff = this._assign(stateDiff);
    this._updateCb({ ...stateDiff });
    return stateDiff;
  }

  protected _onConnect(): void {}

  connect(update: (event: Partial<State>) => void) {
    this._updateCb = update;
    this._onConnect();
    return {
      initialState: { ...this._state },
      settings: this._settings
    };
  }

  protected abstract _onInteraction(stateDiff: Partial<State>, action?: Actions): void;

  interaction(event: UIEvent<State, Actions>) {
    const { action, ...state } = event;
    const stateDiff = this._assign(state as Partial<State>);
    this._onInteraction(stateDiff, action);
  }
}
