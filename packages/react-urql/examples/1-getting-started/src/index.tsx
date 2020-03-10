import React, { FC, StrictMode } from 'react';
import * as ReactDOM from 'react-dom';
import { createClient, Provider, defaultExchanges } from 'urql';
import { devtoolsExchange } from '@urql/devtools';
import { Home } from './pages';
import './index.css';

(async () => {
  if ((await navigator.serviceWorker.getRegistrations()).length > 0) {
    return;
  }

  navigator.serviceWorker
    .register('./service-worker.ts', { scope: '/' })
    .then(() => location.reload());
})();

const client = createClient({
  url: '/graphql',
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
