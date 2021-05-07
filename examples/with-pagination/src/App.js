import { createClient, Provider } from "urql";

import PaginatedNpmSearch from "./pages/PaginatedNpmSearch";

const client = createClient({
  url: "https://trygql.formidable.dev/graphql/relay-npm",
});

function App() {
  return (
    <Provider value={client}>
      <PaginatedNpmSearch />
    </Provider>
  );
}

export default App;
