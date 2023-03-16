/* eslint-disable react/display-name */
/* eslint-disable react-hooks/rules-of-hooks */

import React from 'react';
import { useBasepath, useStaticInfo } from 'react-static';
import { BrowserRouter, StaticRouter, withRouter } from 'react-router-dom';

const Location = withRouter(({ children, location }) => children(location));

const ReactRouterPlugin = ({ RouterProps: userRouterProps = {} }) => ({
  Root:
    PreviousRoot =>
    ({ children }) => {
      const routerProps = { basename: useBasepath() || '' };
      if (routerProps.basename)
        routerProps.basename = `/${routerProps.basename}`;
      const staticInfo = useStaticInfo();

      // Test for document to detect the node stage
      let Router;
      if (typeof document !== 'undefined') {
        // NOTE: React Router is inconsistent in how it handles base paths
        // This will need a trailing slash while the StaticRouter does not
        if (routerProps.basename) routerProps.basename += '/';
        // If in the browser, just use the browser router
        Router = BrowserRouter;
      } else {
        Router = StaticRouter;
        routerProps.location = staticInfo.path; // Required
        routerProps.context = {}; // Required
      }

      return (
        <PreviousRoot>
          <Router {...routerProps} {...userRouterProps}>
            {children}
          </Router>
        </PreviousRoot>
      );
    },
  Routes: PreviousRoutes => props =>
    (
      <Location>
        {location => <PreviousRoutes {...props} location={location} />}
      </Location>
    ),
});

export default ReactRouterPlugin;
