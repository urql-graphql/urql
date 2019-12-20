import React, { FC } from 'react';
import * as ReactDOM from 'react-dom';
import { openDB } from 'idb';
import { createClient, fetchExchange, Provider, dedupExchange } from 'urql';
import { cacheExchange, SerializedEntries } from '@urql/exchange-graphcache';
import Messages from './Messages';

let db;

const storage = {
  read: async () => {
    db = await openDB('myApplication', 1, {
      upgrade: db => db.createObjectStore('keyval'),
    });
    const result = (await db.getAll('keyval')) as SerializedEntries;
    return result;
  },
  write: async batch => {
    for (const key in batch) {
      const value = batch[key];
      if (value === undefined) {
        db.delete('keyval', key);
      } else {
        db.put('keyval', value, key);
      }
    }
  },
};

const client = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [dedupExchange, cacheExchange({ storage }), fetchExchange],
});

export const App: FC = () => (
  <Provider value={client}>
    <main>
      <h1>Messages</h1>
      <Messages />
    </main>
  </Provider>
);

App.displayName = 'App';

ReactDOM.render(<App />, document.getElementById('root'));
