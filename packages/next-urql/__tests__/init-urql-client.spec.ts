import {
  ssrExchange,
  debugExchange,
  dedupExchange,
  cacheExchange,
  fetchExchange,
} from 'urql';

import { initUrqlClient } from '../src/init-urql-client';
import { SSRData } from 'urql/dist/types/exchanges/ssr';

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
    const [urqlClient, ssrCache] = initUrqlClient(
      {
        url: 'http://localhost:3000',
      },
      ssrEx => [
        debugExchange,
        dedupExchange,
        cacheExchange,
        ssrEx,
        fetchExchange,
      ],
    );

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', true);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(ssrCache!.toString()).toEqual(ssrExchange().toString());
  });

  it('should accept some initial state to populate the cache', () => {
    const initialState: SSRData = {
      123: { data: { name: 'Kadabra', type: 'Psychic' } },
      456: { data: { name: 'Butterfree', type: ['Psychic', 'Bug'] } },
    };

    const [urqlClient, ssrCache] = initUrqlClient(
      {
        url: 'http://localhost:3000',
      },
      undefined,
      initialState,
    );

    expect(urqlClient).toHaveProperty('url', 'http://localhost:3000');
    expect(urqlClient).toHaveProperty('suspense', true);

    const data = ssrCache && ssrCache.extractData();
    expect(data).toEqual(initialState);
  });
});
