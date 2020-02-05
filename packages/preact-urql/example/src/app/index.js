import { render } from 'preact';
import { createClient, Provider, defaultExchanges } from '@urql/preact';
import { html } from 'htm/preact'
import { Home } from './Home';

const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: defaultExchanges,
});

export const App = () => html`
  <${Provider} value=${client}>
    <main>
      <h1>Todos</h1>
      <${Home} />
    </main>
  </${Provider}>
`;


render(html`<${App} />`, document.getElementById('root'));
