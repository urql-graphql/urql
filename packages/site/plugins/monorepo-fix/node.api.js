import { silent as resolveFrom } from 'resolve-from';

const NODE_MODULES_JS_RE = /node_modules[/\\].*\.js$/;
const REACT_STATIC_RE = /node_modules[/\\]react-static/;

export default () => ({
  webpack: (config, { stage }) => {
    if (stage === 'node') {
      config.externals = [
        ...config.externals,
        (context, request, callback) => {
          if (/^[./]/.test(request)) {
            return callback();
          }

          const res = resolveFrom(`${context}/`, request);
          if (
            res &&
            NODE_MODULES_JS_RE.test(res) &&
            !REACT_STATIC_RE.test(res)
          ) {
            return callback(null, `commonjs ${request}`);
          } else {
            return callback();
          }
        },
      ];
    }

    return config;
  },
});
