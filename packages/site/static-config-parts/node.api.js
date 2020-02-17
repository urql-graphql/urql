import { resolve } from 'path';

export default () => ({
  webpack: (config, { stage }) => {
    config.resolve.alias = {
      react: resolve(__dirname, '../../../node_modules/react/'),
      'react-dom': resolve(__dirname, '../../../node_modules/react-dom/'),
      'react-dom/server': resolve(
        __dirname,
        '../../../node_modules/react-dom/server'
      ),
    };

    if (stage === 'node') {
      config.externals = [
        ...config.externals,
        (_context, request, callback) => {
          if (/^styled-components|react(-dom(\/server)?)?$/.test(request))
            return callback(null, `commonjs ${request}`);
          callback();
        },
      ];
    }

    return config;
  },
});
