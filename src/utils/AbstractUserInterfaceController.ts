import type { IUserInterfaceController, UIEvent } from '../types/IUserInterfaceController.js';

export abstract class AbstractUserInterfaceController<
  Settings extends object,
  State extends object,
  Actions extends string
> implements IUserInterfaceController<Settings, State, Actions> {
  protected _state = {} as State;
  protected _settings = {} as Settings;
  protected _updateCb: (event: Partial<State>) => void = () => {
    throw new Error('UI not connected');
  };

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
    if (Object.keys(stateDiff).length > 0) {
      this._updateCb({ ...stateDiff });
    }
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
    if (Object.keys(stateDiff).length > 0 || action !== undefined) {
      this._onInteraction(stateDiff, action);
    }
  }
}
