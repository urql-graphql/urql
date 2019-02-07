const path = require('path');

module.exports = {
  entry: './src/app/index.tsx',
  context: __dirname,
  output: {
    path: path.resolve(__dirname, '.build'),
    filename: 'bundle.js',
    publicPath: '/assets/',
  },
  mode: 'development',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.tsx?$/,
        exclude: /\.*node_modules\/*/,
        use: [
          {
            loader: 'awesome-typescript-loader',
            options: {
              configFileName: path.resolve(__dirname, 'tsconfig.json'),
            },
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      urql: path.resolve(__dirname, '../../dist/urql'),
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  stats: 'errors-only',
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
