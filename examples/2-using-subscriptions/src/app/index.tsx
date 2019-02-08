import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import {
  createClient,
  Provider,
  debugExchange,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
} from 'urql';
import './index.css';
import { Messages } from './Messages';

const subscriptionClient = new SubscriptionClient(
  'ws://localhost:4001/graphql',
  {}
);

const client = createClient({
  url: 'http://localhost:4000/graphql',
  subscriptionHandler: operation => subscriptionClient.request(operation),
  exchanges: [
    debugExchange,
    cacheExchange,
    fetchExchange,
    subscriptionExchange,
  ],
});

export const App: React.SFC<{}> = () => (
  <Provider value={client}>
    <main>
      <h1>New messages</h1>
      <Messages />
    </main>
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
