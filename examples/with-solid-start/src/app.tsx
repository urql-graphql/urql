import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import { createClient, Provider, cacheExchange, fetchExchange } from '@urql/solid-start';

const client = createClient({
  url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
  exchanges: [cacheExchange, fetchExchange],
});

export default function App() {
  return (
    <Router
      root={(props) => (
        <Provider value={client}>
          <Suspense>{props.children}</Suspense>
        </Provider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
