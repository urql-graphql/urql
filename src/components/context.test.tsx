import { ContextConsumer, ContextProvider } from './context';

describe('ContextConsumer', () => {
  it('passes snapshot', () => {
    expect(ContextConsumer).toMatchSnapshot();
  });

  it('is exported', () => {
    expect(typeof ContextConsumer).toBe('object');
  });
});

describe('ContextProvider', () => {
  it('passes snapshot', () => {
    expect(ContextProvider).toMatchSnapshot();
  });

  it('is exported', () => {
    expect(typeof ContextProvider).toBe('object');
  });
});
