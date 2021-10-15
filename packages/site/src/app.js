// eslint-disable-next-line react/no-multi-comp

import React, { useEffect } from 'react';
import { Root, Routes } from 'react-static';
import { ThemeProvider } from 'styled-components';

import constants from './constants';
import { GlobalStyle } from './styles/global';
import * as theme from './styles/theme';
import Analytics from './google-analytics';
import { initGoogleTagManager } from './google-tag-manager';
import { Loading } from './components/loading';

const App = () => {
  useEffect(() => {
    initGoogleTagManager();
  }, []);

  return (
    <Root>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <React.Suspense fallback={<Loading />}>
          <Analytics id={constants.googleAnalyticsId}>
            <Routes />
          </Analytics>
        </React.Suspense>
      </ThemeProvider>
    </Root>
  );
};

export default App;
