import { ref } from 'vue';
import { expect, it } from 'vitest';

import { pipe, filter, fromValue, mergeMap } from 'wonka';
import {
  createClient,
  createRequest,
  ssrExchange,
  gql,
  Exchange,
} from '@urql/core';

import { callUseQuery } from './useQuery';

const query = gql`
  query ($name: String!) {
    character(name: $name)
  }
`;

const makeNetworkExchange = () => {
  const state = { calls: 0 };
  const exchange: Exchange = () => ops$ =>
    pipe(
      ops$,
      filter(op => op.kind !== 'teardown'),
      mergeMap(op => {
        state.calls++;
        return fromValue({
          operation: op,
          data: { character: 'from network' },
          stale: false,
          hasNext: false,
        } as any);
      })
    );
  return { exchange, state };
};

it('does not re-execute on hydration when staleWhileRevalidate is false', async () => {
  const variables = { name: 'no-revalidate' };
  const { exchange: network, state } = makeNetworkExchange();
  const ssr = ssrExchange({ isClient: true, staleWhileRevalidate: false });

  const request = createRequest(query, variables);
  ssr.restoreData({
    [request.key]: {
      data: JSON.stringify({ character: 'from ssr' }),
      hasNext: false,
    },
  });

  const client = createClient({
    url: '/graphql',
    exchanges: [ssr, network],
  });

  const query$ = callUseQuery({ query, variables }, ref(client));
  await query$;

  expect(query$.data.value).toEqual({ character: 'from ssr' });
  expect(state.calls).toBe(0);
});

it('still revalidates on hydration when staleWhileRevalidate is true', async () => {
  const variables = { name: 'revalidate' };
  const { exchange: network, state } = makeNetworkExchange();
  const ssr = ssrExchange({ isClient: true, staleWhileRevalidate: true });

  const request = createRequest(query, variables);
  ssr.restoreData({
    [request.key]: {
      data: JSON.stringify({ character: 'from ssr' }),
      hasNext: false,
    },
  });

  const client = createClient({
    url: '/graphql',
    exchanges: [ssr, network],
  });

  const query$ = callUseQuery({ query, variables }, ref(client));
  await query$;

  expect(query$.data.value).toEqual({ character: 'from network' });
  expect(state.calls).toBe(1);
});
