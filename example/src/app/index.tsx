import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router } from '@reach/router';

import { Provider, createClient } from '../../../src/index';
import ConnectTodoApp from './connect';
import HooksTodoApp from './hooks';

const client = createClient({
  url: 'http://localhost:3001/graphql',
});

export const App: React.SFC<{}> = () => (
  <Provider client={client}>
    <Router>
      <ConnectTodoApp path="/" />
      <HooksTodoApp path="/hooks" />
    </Router>
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
