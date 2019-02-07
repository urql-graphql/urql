import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { createClient, Provider } from 'urql';
import { Home } from './home';

const subscriptionClient = new SubscriptionClient(
  'ws://localhost:3001/graphql',
  {}
);

const client = createClient({
  url: 'http://localhost:3001/graphql',
  subscriptionHandler: operation => subscriptionClient.request(operation),
});

export const App: React.SFC<{}> = () => (
  <Provider value={client}>
    <Home />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
