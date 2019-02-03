import { Consumer, Provider } from './context';

describe('ContextConsumer', () => {
  it('passes snapshot', () => {
    expect(Consumer).toMatchSnapshot();
  });

  it('is exported', () => {
    expect(typeof Consumer).toBe('object');
  });
});

describe('ContextProvider', () => {
  it('passes snapshot', () => {
    expect(Provider).toMatchSnapshot();
  });

  it('is exported', () => {
    expect(typeof Provider).toBe('object');
  });
});
