const path = require('path');

module.exports = {
  entry: ['./src/app/index.tsx'],
  output: {
    path: path.resolve(__dirname, 'webpack-build'),
    filename: 'bundle.js',
    publicPath: '/assets/',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js|.ts|.tsx?$/,
        include: [
          path.resolve(__dirname, '../src'),
          path.resolve(__dirname, 'src/app'),
        ],
        exclude: /node_modules/,
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
