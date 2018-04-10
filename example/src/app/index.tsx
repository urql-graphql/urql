import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Provider, Client } from '../../../src/index';
import Home from './home';

const client = new Client({
  url: 'http://localhost:3001/graphql',
});

export const App: React.SFC<{}> = () => (
  <Provider client={client}>
    <Home />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
