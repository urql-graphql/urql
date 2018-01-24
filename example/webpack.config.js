const path = require('path');

module.exports = {
  entry: ['./src/app/index.tsx'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/assets/',
  },
  module: {
    rules: [
      {
        test: /\.js|.ts|.tsx?$/,
        include: [
          path.resolve(__dirname, '../src'),
          path.resolve(__dirname, 'src/app'),
        ],
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  context: __dirname,
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname, '../src'),
      path.resolve(__dirname, 'src/app'),
    ],
    extensions: ['.js', '.ts', '.tsx', '.json', '.jsx', '.css'],
  },
  devtool: 'source-map',
  target: 'web',
  stats: 'errors-only',
  devServer: {
    port: 3000,
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    historyApiFallback: true,
    hot: true,
    https: false,
    noInfo: true,
  },
};
