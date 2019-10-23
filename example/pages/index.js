import React from 'react';
import Head from 'next/head';
import { withUrqlClient } from 'next-urql';

import PokemonList from '../components/pokemon_list';

const Home = () => (
  <div>
    <Head>
      <title>Home</title>
      <link rel="icon" href="/static/favicon.ico" />
    </Head>

    <PokemonList />
  </div>
);

export default withUrqlClient({ url: 'https://graphql-pokemon.now.sh' })(Home);
