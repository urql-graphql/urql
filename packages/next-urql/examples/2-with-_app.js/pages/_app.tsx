import { withUrqlClient, NextUrqlAppContext } from 'next-urql';
import NextApp, { AppProps } from 'next/app';

const App = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

// Implement getInitialProps if your Page components call getInitialProps themselves.
// https://nextjs.org/docs/advanced-features/custom-app
App.getInitialProps = async (ctx: NextUrqlAppContext) => {
  const appProps = await NextApp.getInitialProps(ctx);

  return {
    ...appProps,
  };
};

export default withUrqlClient(() => ({ url: 'https://graphql-pokemon2.vercel.app' }))(
  App
);
