import App, { Container } from 'next/app';
import React from 'react';

import withUrqlClient from '../src/with-urql-client';
import { Provider } from 'urql';

class MyApp extends App {
  render() {
    const { Component, pageProps, urqlClient } = this.props;
    return (
      <Container>
        <Provider value={urqlClient}>
          <Component {...pageProps} />
        </Provider>
      </Container>
    );
  }
}

export default withUrqlClient(MyApp);
