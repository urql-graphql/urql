import React, { FC, StrictMode } from 'react';
import * as ReactDOM from 'react-dom';
import {
  createClient,
  Provider,
  dedupExchange,
  fetchExchange,
  defaultExchanges,
} from 'urql';
import { devtoolsExchange } from '@urql/devtools';
import { cacheExchange } from '@urql/exchange-graphcache';
import { offlineExchange } from './exchanges/offlineExchange';
import { Home } from './Home';
import { suspenseExchange } from '@urql/exchange-suspense';
import './index.css';

const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [...defaultExchanges],
});

export const App: FC = () => (
  <StrictMode>
    <Provider value={client}>
      <main>
        <h1>Todos</h1>
        <Home />
      </main>
    </Provider>
  </StrictMode>
);

App.displayName = 'App';

const container = document.getElementById('root');
const root = ReactDOM.unstable_createRoot(container);
root.render(<App />);
