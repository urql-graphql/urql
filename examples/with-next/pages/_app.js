import { withUrqlClient } from 'next-urql';
import { cacheExchange, fetchExchange } from 'urql';

const App = ({ Component, pageProps }) => <Component {...pageProps} />;

export default withUrqlClient(
  () => ({
    url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
    exchanges: [cacheExchange, fetchExchange],
  }),
  { ssr: false }
)(App);
