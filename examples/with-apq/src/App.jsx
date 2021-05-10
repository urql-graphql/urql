import React from 'react';
import { createClient, Provider, fetchExchange } from 'urql';
import { persistedFetchExchange } from '@urql/exchange-persisted-fetch';

import LocationsList from './LocationsList';

const client = createClient({
  url: 'https://trygql.formidable.dev/graphql/apq-weather',
  exchanges: [
    persistedFetchExchange({
      preferGetForPersistedQueries: true,
    }),
    fetchExchange,
  ],
});

function App() {
  return (
    <Provider value={client}>
      <LocationsList />
    </Provider>
  );
}

export default App;
