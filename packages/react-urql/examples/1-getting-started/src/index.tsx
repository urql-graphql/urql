import React, { FC, StrictMode } from 'react';
import * as ReactDOM from 'react-dom';
import { createClient, Provider, defaultExchanges, Client } from 'urql';
import { devtoolsExchange } from '@urql/devtools';
import { Home } from './pages';
import './index.css';

interface AppProps {
  client: Client,
}

export const App: FC<AppProps> = ({client}) => {
  return (
    <StrictMode>
      <Provider value={client}>
        <main>
          <h1>Todos</h1>
          <Home />
        </main>
      </Provider>
    </StrictMode>
  );
};

App.displayName = 'App';

async function initPage() {
  await navigator.serviceWorker.register('./service-worker.ts', { scope: '/' });

  const client = createClient({
    url: '/sw/graphql',
    exchanges: [devtoolsExchange, ...defaultExchanges],
  });

  ReactDOM.render(<App client={client} />, document.getElementById('root'));
}

initPage();
