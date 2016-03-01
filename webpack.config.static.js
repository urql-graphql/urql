"use strict";

var CleanPlugin = require("clean-webpack-plugin");
var path = require("path");
var StaticSiteGeneratorPlugin = require("static-site-generator-webpack-plugin");
var StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;
var webpack = require("webpack");
var DefinePlugin = webpack.DefinePlugin;

var base = require("./webpack.config.dev.js");

var OUTPUT_DIR = "build";

// All routes we want to static-render:
var ROUTES = [
  "/"
];

module.exports = {
  entry: {
    main: "./src/components/static-entry.jsx"
  },
  output: {
    path: path.join(__dirname, OUTPUT_DIR),
    filename: "main.[hash].js",
    libraryTarget: "umd" // Needs to be universal for `static-site-generator-webpack-plugin` to work
  },
  resolve: base.resolve,
  module: base.module,
  plugins: [
    new CleanPlugin([ path.join(__dirname, OUTPUT_DIR) ]),
    new DefinePlugin({
      "process.env": {
        // Disable warnings for static build
        NODE_ENV: JSON.stringify("production")
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new StatsWriterPlugin({
      filename: "stats.json"
    }),
    new StaticSiteGeneratorPlugin("main", ROUTES)
  ]
};
