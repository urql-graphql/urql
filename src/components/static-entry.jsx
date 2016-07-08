import React from "react";
import { render } from "react-dom";
import { renderToString } from "react-dom/server";

import App from "./app";
import Index from "../../templates/index.hbs";

// Client render (optional):
// `static-site-generator-webpack-plugin` supports shimming browser globals
// so instead of checking whether the document is undefined (always false),
// Check whether it’s being shimmed
if (typeof window !== "undefined" && window.__STATIC_GENERATOR !== true) { //eslint-disable-line no-undef
  render(<App />, document.getElementById("content"));
}

// Expose the function `static-site-generator-webpack-plugin` needs to build its HTML
export default (locals, next) => {
  const source = JSON.parse(locals.webpackStats.compilation.assets["stats.json"].source());
  // For now, `assets` is a string; once we start bundling CSS too, it'll become an array
  const assets = source.assetsByChunkName.main;

  const content = renderToString(<App />);
  const html = Index({
    content,
    bundleJs: assets
  });

  next(null, html);
};
