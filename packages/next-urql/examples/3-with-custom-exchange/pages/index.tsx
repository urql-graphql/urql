import React from 'react';
import Head from 'next/head';
import { withUrqlClient } from 'next-urql';
import { dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { SSRExchange } from 'urql/dist/types/exchanges/ssr';

import PokémonList from '../components/pokemon_list';
import { urlExchange } from '../utils/url-exchange';

const Home: React.FC = () => (
  <div>
    <Head>
      <title>Home</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <PokémonList />
  </div>
);

export default withUrqlClient(
  { url: 'https://graphql-pokemon.now.sh' },
  (ssrExchange: SSRExchange) => [
    dedupExchange,
    urlExchange,
    cacheExchange,
    ssrExchange,
    fetchExchange,
  ],
)(Home);
