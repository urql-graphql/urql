import App from 'next/app';
import React from 'react';

import withUrqlClient from '../src/with-urql-client';
import { Provider } from 'urql';

class MyApp extends App {
  render() {
    const { Component, pageProps, urqlClient } = this.props;
    return (
        <Provider value={urqlClient}>
          <Component {...pageProps} />
        </Provider>
    );
  }
}

// If you want to opt-in to automatic static optimization this
// has to be true. This has the downside that you can't fetch data on
// getInitialProps.
export default withUrqlClient(MyApp, { staticPage: false });
