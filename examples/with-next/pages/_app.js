import { withUrqlClient } from 'next-urql';
import { cacheExchange, fetchExchange } from 'urql';

const App = ({ Component, pageProps }) => <Component {...pageProps} />;

export default withUrqlClient(
  ssrExchange => ({
    url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
    exchanges: [cacheExchange, ssrExchange, fetchExchange],
  }),
  { ssr: false }
)(App);
