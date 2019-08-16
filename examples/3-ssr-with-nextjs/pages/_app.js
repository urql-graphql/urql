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

export default withUrqlClient(MyApp);
