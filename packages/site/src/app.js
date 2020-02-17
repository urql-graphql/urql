import React, { Suspense } from 'react';
import { Routes, Root } from 'react-static';

// import { Analytics } from './analytics';
// import { ScrollToTop } from './scroll-to-top';

import 'prismjs/themes/prism.css';
import './app.css';

const App = () => (
  <Root>
    <Suspense fallback={<h3>Loading</h3>}>
      <Routes />
    </Suspense>
  </Root>
);

export default App;
