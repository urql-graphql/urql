import React, { FC, StrictMode } from 'react';
import * as ReactDOM from 'react-dom';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import {
  cacheExchange,
  createClient,
  debugExchange,
  fetchExchange,
  Provider,
  subscriptionExchange,
  dedupExchange,
} from 'urql';
import './index.css';
import { Messages } from './Messages';
import { SERVER_PORT, WS_PORT } from '../config';

const subscriptionClient = new SubscriptionClient(
  `ws://localhost:${WS_PORT}/graphql`,
  {}
);

const client = createClient({
  url: `http://localhost:${SERVER_PORT}/graphql`,
  exchanges: [
    dedupExchange,
    debugExchange,
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: operation => subscriptionClient.request(operation),
    }),
  ],
});

export const App: FC = () => (
  <StrictMode>
    <Provider value={client}>
      <main>
        <h1>New messages</h1>
        <Messages />
      </main>
    </Provider>
  </StrictMode>
);

App.displayName = 'App';

ReactDOM.render(<App />, document.getElementById('root'));
