import type { DotPaths, LeafValueTypes, Writable } from './typeUtils.js';

export type UIEvent<State, Actions> =
  | {
      type: 'change';
      field: DotPaths<Writable<State>>;
      value: LeafValueTypes<Writable<State>>;
    }
  | {
      type: 'action';
      action: Actions;
    }
  ;

export type IUIController<State, Actions> = {
  connect(handler: (event: Partial<State>) => void): void;
  input(event: UIEvent<State, Actions>): void;
};
