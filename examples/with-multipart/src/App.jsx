import React from 'react';
import { Client, Provider, fetchExchange } from 'urql';

import FileUpload from './FileUpload';

const client = new Client({
  url: 'https://trygql.formidable.dev/graphql/uploads-mock',
  exchanges: [fetchExchange],
});

function App() {
  return (
    <Provider value={client}>
      <FileUpload />
    </Provider>
  );
}

export default App;
