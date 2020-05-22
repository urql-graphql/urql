const path = require('path');
const context = path.resolve(__dirname, '../..');

module.exports = {
  entry: path.resolve(__dirname, './src/app/index.tsx'),
  context,
  mode: 'development',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: require.resolve('source-map-loader'),
          },
        ],
        include: [/node_modules/, context],
        exclude: [/node_modules\/subscriptions\-transport\-ws/],
        enforce: 'pre',
      },
      {
        test: /\.tsx?$/,
        exclude: /\.*node_modules\/*/,
        use: [
          {
            loader: require.resolve('awesome-typescript-loader'),
            options: {
              configFileName: require.resolve('./tsconfig.json'),
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: require.resolve('style-loader'),
          },
          {
            loader: require.resolve('css-loader'),
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },
  stats: 'errors-only',
  output: {
    path: path.resolve(__dirname, '.build'),
    filename: 'bundle.js',
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
    onListening(server) {
      const port = server.listeningApp.address().port;
      console.log(`Frontend server listening at http://localhost:${port}`);
    },
  },
};
