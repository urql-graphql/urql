import React from 'react';
import Head from 'next/head';
import { withUrqlClient, SSRExchange } from 'next-urql';
import { dedupExchange, cacheExchange, fetchExchange } from 'urql';
import fetch from 'isomorphic-unfetch';
import { suspenseExchange } from '@urql/exchange-suspense';

import PokémonList from '../components/pokemon_list';

const Home: React.FC = () => (
  <div>
    <Head>
      <title>Home</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <PokémonList />
  </div>
);

export default withUrqlClient((ssrExchange) => ({
  url: 'https://graphql-pokemon.now.sh',
  fetch,
  suspense: true,
  exchanges: [
    dedupExchange,
    suspenseExchange,
    cacheExchange,
    ssrExchange,
    fetchExchange,
  ]
}))(Home);
