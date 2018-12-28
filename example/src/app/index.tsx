import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, createClient } from '../../../src/index';
import Home from './home';

import { SubscriptionClient } from 'subscriptions-transport-ws';
const subscriptionClient = new SubscriptionClient(
  'ws://localhost:3001/graphql',
  {}
);

const client = createClient({
  url: 'http://localhost:3001/graphql',
  forwardSubscription(operation, observer) {
    return subscriptionClient.request(operation).subscribe({
      next(data) {
        observer.next({ operation, data, error: null });
      },
      error(error) {
        observer.error({ operation, data: null, error });
      },
    });
  },
});

export const App: React.SFC<{}> = () => (
  <Provider client={client}>
    <Home />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
