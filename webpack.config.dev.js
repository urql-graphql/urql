"use strict";

var webpack = require("webpack");

module.exports = {

  devServer: {
    contentBase: __dirname,
    noInfo: false
  },

  output: {
    path: __dirname,
    filename: "main.js"
  },

  cache: true,
  devtool: "source-map",
  entry: {
    app: ["./src/components/entry.jsx"]
  },
  stats: {
    colors: true,
    reasons: true
  },
  resolve: {
    extensions: ["", ".js", ".jsx", ".json"]
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        // Exclude formidable-landers for `npm link` purposes
        exclude: /(node_modules|formidable-landers)/,
        loader: "babel",
        query: {
          presets: ["react", "es2015"]
        }
      }, {
        test: /\.hbs$/,
        loader: "handlebars-loader"
      }, {
        test: /\.md$/,
        loader: "raw-loader"
      }, {
        test: /\.markdown$/,
        loader: "raw-loader"
      }
    ]
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ]
};
