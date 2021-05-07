import { createClient, fetchExchange, Provider } from "urql";
import { retryExchange } from '@urql/exchange-retry';

import Color from "./pages/Color";

const client = createClient({
  url: "https://trygql.formidable.dev/graphql/intermittent-colors",
  exchanges: [
    retryExchange({
      maxNumberAttempts: 5,
      retryIf: error => {
        // NOTE: With this deemo schema we have a specific random error to look out for:
        return error.graphQLErrors.some(x => x.extensions?.code === 'NO_SOUP')
          || !!error.networkError;
      }
    }),
    fetchExchange
  ],
});

function App() {
  return (
    <Provider value={client}>
      <Color />
    </Provider>
  );
}

export default App;
