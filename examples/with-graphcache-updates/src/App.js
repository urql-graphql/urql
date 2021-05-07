import { Provider } from "urql";

import client from "./client";
import Home from "./pages/Home";

function App() {
  return (
    <Provider value={client}>
      <Home />
    </Provider>
  );
}

export default App;
