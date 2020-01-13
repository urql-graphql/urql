import React from 'react';
import Head from 'next/head';

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

export default Home;
