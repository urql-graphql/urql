import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';

import PokémonList from '../components/pokemon_list';

interface InitialProps {
  title: string;
}

const Home: NextPage<InitialProps> = ({ title }) => {
  return (
    <div>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>{title}</h1>
      <PokémonList />
    </div>
  );
};

Home.getInitialProps = () => {
  return {
    title: 'Pokédex',
  };
};

export default Home;
