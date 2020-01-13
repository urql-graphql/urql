import React from 'react';
import { withUrqlClient } from 'next-urql';
import { AppPropsType } from 'next/dist/next-server/lib/utils';

const App: React.FC<AppPropsType> = ({ Component, pageProps }) => (
  <Component {...pageProps} />
);

export default withUrqlClient({ url: 'https://graphql-pokemon.now.sh' })(App);
