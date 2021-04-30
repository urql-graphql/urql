import React from 'react';
import { Provider } from 'urql';

import client from './client';
import { AuthContextProvider } from './auth/AuthContext';
import Home from './pages/Home';

function App() {
  return (
    <Provider value={client}>
      <AuthContextProvider>
        <Home />
      </AuthContextProvider>
    </Provider>
  );
}

export default App;
