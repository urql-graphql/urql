import { cacheExchange } from '@urql/exchange-graphcache';
import React, { FC } from 'react';
import * as ReactDOM from 'react-dom';

import {
  createClient,
  debugExchange,
  dedupExchange,
  fetchExchange,
  Provider,
} from 'urql';

import { Home } from './home';
import './index.css';

const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [dedupExchange, debugExchange, cacheExchange({}), fetchExchange],
});

export const App: FC = () => (
  <Provider value={client}>
    <main>
      <h1>Todos</h1>
      <Home />
    </main>
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
