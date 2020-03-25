import { Target } from './Target';

describe('on construct', () => {
  it('matches snapshot', () => {
    expect(new Target()).toMatchSnapshot();
  });
});

describe('on addEventListener -> dispatchEvent', () => {
  it('calls event listeners with event', () => {
    const t = new Target();
    const listeners = [jest.fn(), jest.fn(), jest.fn()];
    const event = { type: 'DEBUG_TEST' } as any;

    listeners.forEach(t.addEventListener);
    t.dispatchEvent(event);

    listeners.forEach(l => {
      expect(l).toBeCalledTimes(1);
      expect(l).toBeCalledWith(event);
    });
  });
});

describe('on removeEventListener -> dispatchEvent', () => {
  it('does not call removed event listeners', () => {
    const t = new Target();
    const listeners = [jest.fn(), jest.fn(), jest.fn()];
    const excludedListener = jest.fn();
    const event = { type: 'DEBUG_TEST' } as any;

    t.addEventListener(excludedListener);
    listeners.forEach(t.addEventListener);
    t.removeEventListener(excludedListener);
    t.dispatchEvent(event);

    expect(excludedListener).toBeCalledTimes(0);
    listeners.forEach(l => {
      expect(l).toBeCalledTimes(1);
    });
  });
});
