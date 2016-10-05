import React from "react";
import { render } from "react-dom";
import { renderToString } from "react-dom/server";
import { Router, RouterContext, match, applyRouterMiddleware, useRouterHistory } from "react-router";
import { createMemoryHistory, createHistory } from "history";
import useScroll from "react-router-scroll";
import { renderAsHTML } from "./title-meta";
import ReactGA from "react-ga";

import Index from "../../templates/index.hbs";
import routes from "../routes";
import basename from "../basename";

// ----------------------------------------------------------------------------
// With `static-site-generator-webpack-plugin`, the same bundle is responsible for
// both 1.) telling the plugin what to render to HTML and
// 2.) running the app on the client side. In other words, this entry point
// the roles of `server/index` and `client/app`.
// ----------------------------------------------------------------------------

// Client render (optional):
// `static-site-generator-webpack-plugin` supports shimming browser globals
// so instead of checking whether the document is undefined (always false),
// Check whether it’s being shimmed
if (typeof window !== "undefined" && window.__STATIC_GENERATOR !== true) { //eslint-disable-line no-undef
  const history = useRouterHistory(createHistory)({ basename });
  // Add Google Analytics tracking for each page
  ReactGA.initialize("UA-43290258-1");
  history.listen((location) => {
    const fullLocation = basename + location.pathname;
    ReactGA.set({ page: fullLocation });
    ReactGA.pageview(fullLocation);
  });
  render(
    <Router
      history={history}
      routes={routes}
      render={applyRouterMiddleware(useScroll())}
    />,
    document.getElementById("content")
  );
}

// Exported static site renderer:
export default (locals, callback) => {
  // userAgent for radium vendor prefixing
  global.navigator = {
    userAgent: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2454.85 Safari/537.36"
  };

  const history = useRouterHistory(createMemoryHistory)({ basename });
  const location = history.createLocation(locals.path);
  match({ routes, location, history }, (error, redirectLocation, renderProps) => {
    const content = renderToString(<RouterContext {...renderProps} />);
    const source = JSON.parse(locals.webpackStats.compilation.assets["stats.json"].source());
    callback(null, Index({
      titleMeta: renderAsHTML(),
      content,
      bundleJs: locals.assets.main,
      bundleCss: source.assetsByChunkName.main[1],
      baseHref: `${basename}/`
    }));
  });
};
