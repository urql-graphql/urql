import React from 'react';
import Head from 'next/head';

import PokemonList from '../components/pokemon_list';

const Home = () => (
  <div>
    <Head>
      <title>Home</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <PokemonList />
  </div>
);

export default Home;
