import React from 'react';
import { withUrqlClient } from 'next-urql';
import { AppProps } from 'next/app';

const App = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

export default withUrqlClient({ url: 'https://graphql-pokemon.now.sh' })(App);
