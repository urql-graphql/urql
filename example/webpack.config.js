const path = require('path');
const context = path.resolve(__dirname, '../..');

module.exports = {
  entry: path.resolve(__dirname, './src/app/index.js'),
  context,
  mode: 'development',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /\.*node_modules\/*/,
        type: 'javascript/auto',
      },
    ],
  },
  resolve: {
    alias: {
      preact: path.resolve(__dirname, '../node_modules/preact'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.json'],
  },
  output: {
    path: path.resolve(__dirname, '.build'),
    filename: 'index.js',
    publicPath: '/assets/',
  },
  devtool: 'eval-source-map',
  devServer: {
    allowedHosts: ['app'],
    host: '0.0.0.0',
    port: 3000,
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    historyApiFallback: true,
    hot: true,
    https: false,
    noInfo: true,
  },
};
