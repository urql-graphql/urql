import React from 'react';
import { withUrqlClient } from 'next-urql';

const App = ({ Component, pageProps }) => <Component {...pageProps} />;

export default withUrqlClient({ url: 'https://graphql-pokemon.now.sh' })(App);
