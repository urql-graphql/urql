import React, { FC, StrictMode } from 'react';
import * as ReactDOM from 'react-dom';
import { createClient, Provider, defaultExchanges } from 'urql';
import { devtoolsExchange } from '@urql/devtools';
import { Home } from './Home';
import './index.css';

const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [devtoolsExchange, ...defaultExchanges],
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

ReactDOM.render(<App />, document.getElementById('root'));
