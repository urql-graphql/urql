import { ssrExchange } from 'urql';

import { initUrqlClient } from '../init-urql-client';

describe('initUrqlClient', () => {
  it('should return the urqlClient instance and ssrCache', () => {
    const [urqlClient, ssrCache] = initUrqlClient({
      url: 'http://localhost:3000',
    });

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', true);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(ssrCache!.toString()).toEqual(ssrExchange().toString());
  });

  it('should accept an optional mergeExchanges function to allow for exchange composition', () => {
    const [urqlClient, ssrCache] = initUrqlClient({
      url: 'http://localhost:3000',
    });

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', true);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(ssrCache!.toString()).toEqual(ssrExchange().toString());
  });
});
