import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbstractUserInterfaceController } from './AbstractUserInterfaceController.js';

type State = {
  n: number;
  s: string;
  b: boolean;
  readonly rn: number;
  readonly rs: string;
};

type Settings = {
  s0: string[];
};

type Actions = 'a1' | 'a2';

const connect = vi.fn();
const interaction = vi.fn();

// Silence console logs
vi.spyOn(console, 'log').mockImplementation(() => {});

class TestUserInterfaceController extends AbstractUserInterfaceController<Settings, State, Actions> {
  constructor() {
    super();
    this._state = {
      n: 0,
      s: '',
      b: false,
      rn: 0,
      rs: ''
    };
    this._settings = {
      s0: ['a', 'b', 'c']
    };
  }

  protected override _onConnect(): void {
    connect();
  }

  protected override _onInteraction(stateDiff: Partial<State>, action?: Actions): void {
    interaction(stateDiff, action);
  }

  internalUpdate(stateDiff: Partial<State>) {
    return this._update(stateDiff);
  }
}

let uiController: TestUserInterfaceController;
const update = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  uiController = new TestUserInterfaceController();
  uiController.connect(update);
});

it('sends initial state and settings on connect', () => {
  expect(update).not.toHaveBeenCalled();
  expect(connect).toHaveBeenCalled();
  expect(uiController.state).toStrictEqual({
    n: 0,
    s: '',
    b: false,
    rn: 0,
    rs: ''
  });
  expect(uiController.settings).toStrictEqual({
    s0: ['a', 'b', 'c']
  });
});

describe('User Interface interactions', () => {
  it('identifies the differences', () => {
    uiController.interaction({ n: 1, b: false });
    expect(interaction).toHaveBeenCalledWith({ n: 1 }, undefined);
  });

  it('updates the state', () => {
    uiController.interaction({ n: 1, s: 'Hello World !' });
    expect(uiController.state).toStrictEqual({
      n: 1,
      s: 'Hello World !',
      b: false,
      rn: 0,
      rs: ''
    });
  });

  it('identifies the action', () => {
    uiController.interaction({ n: 1, b: false, action: 'a1' });
    expect(interaction).toHaveBeenCalledWith({ n: 1 }, 'a1');
  });

  it('does not call onInteraction if if no change occurred', () => {
    uiController.interaction({});
    expect(interaction).not.toHaveBeenCalled();
  });
});

describe('User Interface updates from the controller', () => {
  it('fails if no UI is connected', () => {
    const myController = new TestUserInterfaceController();
    expect(() => myController.internalUpdate({ n: 1 })).toThrow('UI not connected');
  });

  it('identifies the differences', () => {
    const result = uiController.internalUpdate({ n: 1, b: false });
    expect(result).toStrictEqual({ n: 1 });
  });

  it('updates the state', () => {
    uiController.internalUpdate({ n: 1, s: 'Hello World !' });
    expect(uiController.state).toStrictEqual({
      n: 1,
      s: 'Hello World !',
      b: false,
      rn: 0,
      rs: ''
    });
  });

  it('notifies the UI of the change', () => {
    uiController.internalUpdate({ n: 1, b: false });
    expect(update).toHaveBeenCalledWith({ n: 1 });
  });

  it('does not notify the UI if no change occurred', () => {
    uiController.internalUpdate({});
    expect(update).not.toHaveBeenCalled();
  });
});
