'use client';

import {
  UrqlProvider,
  ssrExchange,
  cacheExchange,
  fetchExchange,
  createClient,
} from '@urql/next';

const ssr = ssrExchange();
const client = createClient({
  url: 'https://graphql-pokeapi.graphcdn.app/',
  exchanges: [cacheExchange, ssr, fetchExchange],
  suspense: true,
});

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <UrqlProvider client={client} ssr={ssr}>
      {children}
    </UrqlProvider>
  );
}
