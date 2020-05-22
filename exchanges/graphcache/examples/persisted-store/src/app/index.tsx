import React, { FC } from 'react';
import * as ReactDOM from 'react-dom';
import { openDB } from 'idb';
import { createClient, fetchExchange, Provider, dedupExchange, RequestPolicy } from 'urql';
import { cacheExchange, SerializedEntries } from '@urql/exchange-graphcache';
import Messages from './Messages';

let db;

const storage = {
  read: async () => {
    if (!db) {
      db = await openDB('myApplication', 1, {
        upgrade: db => db.createObjectStore('keyval'),
      });
    }

    const readResult = await Promise.all([db.getAllKeys('keyval'), db.getAll('keyval')]).then(
      ([keys, values]) => {
        return keys.reduce((acc: SerializedEntries, key, i) => {
          acc[key] = values[i];
          return acc;
        }, {});
      }
    );

    console.log('Read from Graphcache', readResult);

    return readResult;
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
    console.log('Wrote to Graphcache', JSON.stringify(batch));
  },

  deleteAll: async () => {
    const keys = await db.getAllKeys('keyval');
    const deletePromises = keys.map(async key => db.delete('keyval', key));
    await Promise.all(deletePromises);
    console.log('Cleared Graphcache');
  },
};

const resolvers = {
  Message: {
    message(parent, args, cache, info) {
      return parent.message.toUpperCase();
    },
  },
};

const client = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [dedupExchange, cacheExchange({ storage, resolvers }), fetchExchange],
});

// Default to cache-first, but remember the last policy in local storage.
let requestPolicy: RequestPolicy;
if (typeof localStorage.getItem('requestPolicy') === 'string') {
  requestPolicy = localStorage.getItem('requestPolicy') as RequestPolicy;
} else {
  requestPolicy = 'cache-first';
}

function setRequestPolicy(newPolicy) {
  requestPolicy = newPolicy;
  localStorage.setItem('requestPolicy', newPolicy);
  updatedAt++;
  render();
};

let updatedAt = Date.now();

async function reexecuteQuery() {
  updatedAt++;
  render();
  console.log('Re-executed query');
};

async function clearCache() {
  await storage.deleteAll();
};

function render() {
  ReactDOM.render(<App />, document.getElementById('root'));
}

export const App: FC = () => {
  return (
    <Provider value={client}>
      <main>
        <h1>Messages</h1>

        <Messages requestPolicy={requestPolicy} updatedAt={updatedAt} />

        <h2>Options</h2>

        <p>Using requestPolicy: {requestPolicy}</p>

        <p>
          <button onClick={() => setRequestPolicy('cache-first')}>Set requestPolicy=cache-first</button>
          <button onClick={() => setRequestPolicy('cache-only')}>Set requestPolicy=cache-only</button>
          <button onClick={() => setRequestPolicy('network-only')}>Set requestPolicy=network-only</button>
          <button onClick={() => setRequestPolicy('cache-and-network')}>Set requestPolicy=cache-and-network</button>
        </p>

        <p>
          <button onClick={reexecuteQuery}>Re-execute query</button>
          <button onClick={clearCache}>Clear cache (won't affect Graphcache until page is refreshed)</button>
        </p>
      </main>
    </Provider>
  );
};

App.displayName = 'App';

render();
