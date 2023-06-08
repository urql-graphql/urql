import React, { useState } from 'react';
import { Client, Provider, cacheExchange, fetchExchange } from 'urql';

import SearchRoot from './SearchResults';

const client = new Client({
  // The GraphQL API we use here uses the NPM registry
  // We'll use it to display search results for packages
  url: 'https://trygql.formidable.dev/graphql/relay-npm',
  exchanges: [cacheExchange, fetchExchange],
});

// We will be able to enter a search term, and this term
// will render search results
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
        {/* Try changing the search input, then changing it back... */}
        {/* If you do this, all cached pages will display immediately! */}
        <input
          type="search"
          value={search}
          onChange={setSearchValue}
          placeholder="npm package name"
        />
      </header>
      <main>
        {/* The <SearchRoot> component contains all querying logic */}
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
