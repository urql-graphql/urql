import React, { FC } from 'react';
import * as ReactDOM from 'react-dom';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import {
  createClient,
  fetchExchange,
  Provider,
  subscriptionExchange,
} from 'urql';
import { cacheExchange, Data } from '@urql/exchange-graphcache';
import './index.css';
import { Messages } from './Messages';
import gql from 'graphql-tag';

const subscriptionClient = new SubscriptionClient(
  'ws://localhost:4001/graphql',
  {}
);

const client = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [
    cacheExchange({
      updates: {
        Subscription: {
          newMessage: (data, _, cache) => {
            cache.updateQuery(
              gql`
                query {
                  messages {
                    id
                    message
                  }
                }
              `,
              prevData => ({
                ...prevData,
                messages: [...(prevData.messages as Data[]), data.newMessage],
              })
            );
          },
        },
      },
    }),
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: operation => subscriptionClient.request(operation),
    }),
  ],
});

export const App: FC = () => (
  <Provider value={client}>
    <main>
      <h1>New messages</h1>
      <Messages />
    </main>
  </Provider>
);

App.displayName = 'App';

ReactDOM.render(<App />, document.getElementById('root'));
