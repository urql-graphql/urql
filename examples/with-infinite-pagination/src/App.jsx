import React, { useState } from 'react';
import { Client, Provider, cacheExchange, fetchExchange } from 'urql';

import SearchRoot from './SearchResults';

const client = new Client({
  url: 'https://trygql.formidable.dev/graphql/relay-npm',
  exchanges: [cacheExchange, fetchExchange],
});

function PaginatedNpmSearch() {
  const [search, setSearch] = useState('urql');

  const setSearchValue = event => {
    event.preventDefault();
    setSearch(event.currentTarget.value);
  };

  return (
    <>
      <header>
        <h4>Type to search for npm packages</h4>
        <input
          type="search"
          value={search}
          onChange={setSearchValue}
          placeholder="npm package name"
        />
      </header>
      <main>
        <SearchRoot searchTerm={search} />
      </main>
    </>
  );
}

function App() {
  return (
    <Provider value={client}>
      <PaginatedNpmSearch />
    </Provider>
  );
}

export default App;
