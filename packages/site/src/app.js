// eslint-disable-next-line react/no-multi-comp

import React from 'react';
import { Root, Routes } from 'react-static';
import { ThemeProvider } from 'styled-components';

import constants from './constants';
import { GlobalStyle } from './styles/global';
import * as theme from './styles/theme';
import Analytics from './google-analytics';
import { Loading } from './components/loading';
import { Switch, Route } from 'react-router-dom';

const App = () => {
  return (
    <Root>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <React.Suspense fallback={<Loading />}>
          <Analytics id={constants.googleAnalyticsId}>
            <Switch>
              <Route render={() => <Routes />} />
            </Switch>
          </Analytics>
        </React.Suspense>
      </ThemeProvider>
    </Root>
  );
};

export default App;
