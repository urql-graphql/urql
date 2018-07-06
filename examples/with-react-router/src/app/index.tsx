import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import { Provider, Client } from '../../../../src/index';
import Home from './home';
import About from './about';

const client = new Client({
  url: 'http://localhost:3001/graphql',
});

export const App: React.SFC<{}> = () => (
  <Provider client={client}>
    <Router>
      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
        </ul>
        <Route exact path="/" component={Home} />
        <Route exact path="/about/:id" component={About} />
      </div>
    </Router>
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
