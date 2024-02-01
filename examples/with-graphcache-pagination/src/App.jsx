import React from 'react';
import { Client, Provider, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { relayPagination } from '@urql/exchange-graphcache/extras';

import PaginatedNpmSearch from './PaginatedNpmSearch';

const search = relayPagination();

const client = new Client({
  url: 'https://trygql.formidable.dev/graphql/relay-npm',
  exchanges: [
    cacheExchange({
      resolvers: {
        Query: {
          search(data, args, cache, info) {
            // When we return to write the first page, we only return the future page,
            // and force a re-fetch of the list field
            if (!args.after && !args.before) {
              info.partial = true;
              return cache.resolve(info.parentKey, info.parentFieldKey);
            }

            return search(data, args, cache, info);
          },
        },
      },

      updates: {
        Query: {
          search(_data, args, cache, info) {
            // When we return to write the first page, we invalidate all future pages
            if (!args.after && !args.before) {
              const fields = cache.inspectFields(info.parentKey);
              for (const field of fields) {
                if (
                  field.fieldName === 'search' &&
                  (field.arguments.before || field.arguments.after)
                ) {
                  cache.invalidate(info.parentKey, field.fieldKey);
                }
              }
            }
          },
        },
      },
    }),
    fetchExchange,
  ],
});

function App() {
  return (
    <Provider value={client}>
      <PaginatedNpmSearch />
    </Provider>
  );
}

export default App;
