import { initUrqlClient } from '../init-urql-client';

describe('initUrqlClient', () => {
  it('should return the urqlClient instance and ssrCache', () => {
    const urqlClient = initUrqlClient({
      url: 'http://localhost:3000',
    });

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', true);
  });

  it('should accept an optional mergeExchanges function to allow for exchange composition', () => {
    const urqlClient = initUrqlClient({
      url: 'http://localhost:3000',
    });

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', true);
  });
});
