import React from 'react';
import {
  createClient,
  Provider,
  dedupExchange,
  cacheExchange,
  debugExchange,
  fetchExchange,
} from 'urql';

import Songs from './Songs';

const client = createClient({
  url: 'http://localhost:3004/graphql',
  exchanges: [dedupExchange, cacheExchange, debugExchange, fetchExchange],
});

function App() {
  return (
    <Provider value={client}>
      <Songs />
    </Provider>
  );
}

export default App;
