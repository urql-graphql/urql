// eslint-disable-next-line react/no-multi-comp

import React from 'react';
import { Root, Routes } from 'react-static';
import { ThemeProvider } from 'styled-components';

import constants from './constants';
import { GlobalStyle } from './styles/global';
import * as theme from './styles/theme';
import Analytics from './google-analytics';

// TODO: import NotFound from './screens/404';

const App = () => {
  return (
    <Root>
      {/* TODO: create a better fallback component */}
      <React.Suspense fallback={<h1>Loading</h1>}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <Analytics id={constants.googleAnalyticsId}>
            <Routes />
          </Analytics>
        </ThemeProvider>
      </React.Suspense>
    </Root>
  );
};

export default App;
