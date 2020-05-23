import React from 'react';
import { NextComponentType } from 'next';
import Head from 'next/head';
import { withUrqlClient, NextUrqlPageContext } from 'next-urql';
import fetch from 'isomorphic-unfetch';
import PokémonList from '../components/pokemon_list';

const Home: NextComponentType<NextUrqlPageContext> = () => (
  <div>
    <Head>
      <title>Home</title>
      <link rel="icon" href="/static/favicon.ico" />
    </Head>
    <PokémonList />
  </div>
);

export default withUrqlClient((_ssr: object, ctx: NextUrqlPageContext) => {
  return {
    url: 'https://graphql-pokemon.now.sh',
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ctx?.req?.headers?.authorization ?? ''}`,
      },
    },
    fetch,
  };
})(Home);
