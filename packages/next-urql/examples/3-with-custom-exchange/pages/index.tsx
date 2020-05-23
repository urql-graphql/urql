import React from 'react';
import Head from 'next/head';
import { withUrqlClient, SSRExchange } from 'next-urql';
import { dedupExchange, cacheExchange, fetchExchange } from 'urql';
import fetch from 'isomorphic-unfetch';

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

export default withUrqlClient((ssrExchange) => ({
  exchanges: [
    dedupExchange,
    urlExchange,
    cacheExchange,
    ssrExchange,
    fetchExchange,
  ],
  url: 'https://graphql-pokemon.now.sh',
  fetch,
}))(Home);
