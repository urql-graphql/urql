export default () => ({
  webpack(config) {
    const rules = config.module.rules[0].oneOf;
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule.loader === 'url-loader') {
        delete rule.options;
        rule.query = {
          limit: 10000,
          name: 'static/[name].[hash:8].[ext]',
        };
      }
    }

    return config;
  },
});
