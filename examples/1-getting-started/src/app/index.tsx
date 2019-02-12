import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createClient, Provider } from 'urql';
import { Home } from './home';
import './index.css';

const client = createClient({
  url: 'http://localhost:3001/graphql',
});

export const App: React.SFC<{}> = () => (
  <Provider value={client}>
    <main>
      <h1>Todos</h1>
      <Home />
    </main>
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
