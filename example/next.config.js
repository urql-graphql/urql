const path = require('path');

module.exports = {
  webpack(config) {
    config.resolve.alias.react = path.resolve(
      __dirname,
      '../node_modules/react/',
    );
    config.resolve.alias['react-dom'] = path.resolve(
      __dirname,
      '../node_modules/react-dom/',
    );
    config.resolve.alias['react-is'] = path.resolve(
      __dirname,
      '../node_modules/react-is/',
    );
    config.resolve.alias.urql = path.resolve(
      __dirname,
      '../node_modules/urql/',
    );
    config.resolve.alias['next-urql'] = path.resolve(__dirname, '../');
    return config;
  },
};
