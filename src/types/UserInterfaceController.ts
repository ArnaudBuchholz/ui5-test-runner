import type { SinglePartial, Writable } from './typeUtilities.js';

export type UIEvent<State, Actions> =
  | {
      type: 'change';
    } & SinglePartial<Writable<State>>
  | {
      type: 'action';
      action: Actions;
    };

export type IUIController<State, Actions> = {
  connect(handler: (event: Partial<State>) => void): void;
  interaction(event: UIEvent<State, Actions>): void;
};
