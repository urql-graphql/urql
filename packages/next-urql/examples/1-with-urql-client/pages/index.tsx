import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { withUrqlClient, NextUrqlPageContext } from 'next-urql';
import fetch from 'isomorphic-unfetch';
import PokémonList from '../components/pokemon_list';

interface InitialProps {
  title?: string;
}

const Home: NextPage<InitialProps, InitialProps> = ({ title }) => (
  <div>
    <Head>
      <title>Home</title>
      <link rel="icon" href="/static/favicon.ico" />
    </Head>
    <h1>{title}</h1>
    <PokémonList />
  </div>
);

Home.getInitialProps = () => {
  return {
    title: 'Pokédex',
  };
};

export default withUrqlClient((_ssr: object, ctx?: NextUrqlPageContext) => {
  return {
    url: 'https://graphql-pokemon2.vercel.app',
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ctx?.req?.headers?.authorization ?? ''}`,
      },
    },
    fetch,
  };
})(Home);
