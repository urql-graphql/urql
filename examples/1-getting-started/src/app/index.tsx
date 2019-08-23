import React, { FC, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { createClient, Provider, defaultExchanges } from 'urql';
import { devtoolsExchange } from '@urql/devtools';
import { Home } from './Home';
import './index.css';
import gql from 'graphql-tag';

const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [devtoolsExchange, ...defaultExchanges],
});

export const App: FC = () => {
  useEffect(() => {
    const result = client.query({
      query: gql`
        query {
          todos {
            id
            text
            complete
          }
        }
      `,
    });
    console.log(result);
    result.then(res => {
      console.log('inside then');
      console.log(res);
    });
  }, []);
  return (
    <Provider value={client}>
      <main>
        <h1>Todos</h1>
        {/* <Home /> */}
      </main>
    </Provider>
  );
};

App.displayName = 'App';

ReactDOM.render(<App />, document.getElementById('root'));
