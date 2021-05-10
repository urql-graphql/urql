import { withUrqlClient } from 'next-urql';

const App = ({ Component, pageProps }) => <Component {...pageProps} />;

export default withUrqlClient(
  () => ({
    url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
  }),
  { ssr: false }
)(App);
