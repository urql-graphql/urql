import React, { useLayoutEffect, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Root, Routes } from 'react-static';
import { Route } from 'react-router';
import { animateScroll as scroll } from 'react-scroll';
import { ResizeObserver as _ResizeObserver } from '@juggle/resize-observer';
import get from 'lodash/get';

import { GlobalStyle } from './global-style';
import Analytics from './google-analytics';
import NotFound from './screens/404';

import 'prismjs/themes/prism.css';
import './app.css';

const HEADER_PIXEL_HEIGHT = 60;
const SCROLL_PIXEL_OFFSET = 25;
const DEFAULT_PAGE_CONTENT_CLASS = '.Page-content';
const ROUTES = ['docs'];

const scrollContent = async (
  hash,
  contentPaneClass = DEFAULT_PAGE_CONTENT_CLASS
) => {
  const item = document.querySelector(`${contentPaneClass} ${hash}`);

  if (!item) {
    return;
  }

  const rect = item.getBoundingClientRect();
  const truePosition =
    (rect.top + window.pageYOffset || document.documentElement.scrollTop) -
    HEADER_PIXEL_HEIGHT -
    SCROLL_PIXEL_OFFSET;

  scroll.scrollTo(truePosition, {
    duration: 200,
    delay: 0,
    smooth: 'easeOutQuad',
  });
};

const checkScrollRoutes = (pathname, routes = ROUTES) =>
  routes.some(r => pathname.includes(r));

const ScrollToCurrentSection = ({ location, children }) => {
  const { pathname, hash = '' } = location;

  const [pageContentHeight, setPageContentHeight] = useState(null);

  const pageContentHeightObserver = new _ResizeObserver((element, observer) => {
    const elementHeight = get(element, ['0', 'contentRect', 'height'], 0);
    setPageContentHeight(elementHeight);
    observer.disconnect();
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && pageContentHeight === null) {
      const mainElement = document.querySelector(DEFAULT_PAGE_CONTENT_CLASS);
      if (mainElement) {
        pageContentHeightObserver.observe(mainElement);
      }
    }
  }, [pageContentHeight, pageContentHeightObserver, pathname]);

  useLayoutEffect(() => {
    if (checkScrollRoutes(pathname)) {
      scrollContent(hash);
    } else {
      scroll.scrollTo(0, {
        duration: 0,
        delay: 0,
      });
    }
  }, [hash, pathname, pageContentHeight]);

  return children;
};

ScrollToCurrentSection.propTypes = {
  children: PropTypes.node,
  location: PropTypes.object,
};

// eslint-disable-next-line react/no-multi-comp
const App = () => {
  return (
    <Root>
      {/* TODO: create a better fallback component */}
      <React.Suspense fallback={<h1>Loading</h1>}>
        <GlobalStyle />
        <Analytics id="UA-43290258-1">
          <Routes
            render={({ routePath, getComponentForPath }) => (
              <Route path="*">
                {props => {
                  const Comp = getComponentForPath(routePath) || <NotFound />;
                  // Add react-router route props like location and history
                  const CompWithRouteProps = React.cloneElement(Comp, props);
                  return (
                    <ScrollToCurrentSection {...props}>
                      {CompWithRouteProps}
                    </ScrollToCurrentSection>
                  );
                }}
              </Route>
            )}
          />
        </Analytics>
      </React.Suspense>
    </Root>
  );
};

export default App;
