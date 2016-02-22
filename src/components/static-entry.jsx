import React from "react";
import { render } from "react-dom";
import { renderToString } from "react-dom/server";

import App from "./app";
import Index from "../../templates/index.hbs";

// Run once we hit the client side
if (typeof document !== "undefined") {
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
