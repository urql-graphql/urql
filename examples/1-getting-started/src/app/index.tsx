import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createClient, Provider } from 'urql';
import { Home } from './home';

const client = createClient({
  url: 'http://localhost:3001/graphql',
});

export const App: React.SFC<{}> = () => (
  <Provider value={client}>
    <Home />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
