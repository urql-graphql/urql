import Head from 'next/head';
import { withUrqlClient, SSRExchange } from 'next-urql';
import { dedupExchange, cacheExchange, fetchExchange } from 'urql';

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
  url: 'https://graphql-pokemon2.vercel.app',
}))(Home);
