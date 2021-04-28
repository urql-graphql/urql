import { createClient, fetchExchange, Provider } from "urql";
import { retryExchange } from '@urql/exchange-retry';

import "./App.css";
import Color from "./pages/Color";

const client = createClient({
  url: "https://trygql.dev/graphql/intermittent-colors",
  exchanges: [
    retryExchange({
      maxNumberAttempts: 5,
      retryIf: error => {
        return Boolean(error && (error.graphQLErrors.length > 0 || error.networkError));
      }
    }), // Use the retryExchange factory to add a new exchange,
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
