import React, { FC } from 'react';
import * as ReactDOM from 'react-dom';
import { createClient, Provider, populateExchange, fetchExchange } from 'urql';
import { devtoolsExchange } from '@urql/devtools';
import { Home } from './Home';
import { typeDefs } from '../server/schema';
import './index.css';
import { buildSchema, introspectionFromSchema } from 'graphql';
import { cacheExchange } from '@urql/exchange-graphcache';

const schema = introspectionFromSchema(buildSchema(typeDefs));

const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [
    populateExchange({
      schema,
    }),
    cacheExchange({ schema }),
    devtoolsExchange,
    fetchExchange,
  ],
});

export const App: FC = () => (
  <Provider value={client}>
    <main>
      <h1>Todos</h1>
      <Home />
    </main>
  </Provider>
);

App.displayName = 'App';

ReactDOM.render(<App />, document.getElementById('root'));
