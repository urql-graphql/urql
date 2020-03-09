export default () => ({
  webpack: (config, { stage }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    };

    return config;
  },
});
