import React, { Suspense } from 'react';
import { Routes, Root } from 'react-static';
import Analytics from 'react-router-ga';

import { GlobalStyle } from './global-style';
import { ScrollToTop } from './scroll-to-top';

import 'prismjs/themes/prism.css';

const App = () => (
  <Root>
    <Analytics id="UA-43290258-1">
      <main>
        <Suspense fallback={<h3>Loading</h3>}>
          <GlobalStyle />
          <ScrollToTop />
          <Routes />
        </Suspense>
      </main>
    </Analytics>
  </Root>
);

export default App;
