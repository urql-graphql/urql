import React from 'react';
import { createClient, Provider } from 'urql';

import PaginatedNpmSearch from './PaginatedNpmSearch';

const client = createClient({
  url: 'https://trygql.formidable.dev/graphql/relay-npm',
});

function App() {
  return (
    <Provider value={client}>
      <PaginatedNpmSearch />
    </Provider>
  );
}

export default App;
