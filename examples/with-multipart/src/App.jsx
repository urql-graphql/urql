import React from "react";
import { createClient, Provider } from "urql";
import { multipartFetchExchange } from "@urql/exchange-multipart-fetch";

import FileUpload from "./FileUpload";

const client = createClient({
  url: "https://trygql.formidable.dev/graphql/uploads-mock",
  exchanges: [multipartFetchExchange],
});

function App() {
  return (
    <Provider value={client}>
      <FileUpload />
    </Provider>
  );
}

export default App;
