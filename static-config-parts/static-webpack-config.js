// SURGEON GENERAL'S WARNING: THIS IS NOT A WEBPACK CONFIG, THIS IS A FUNCTION
// THAT ENHANCES THE BASE REACT-STATIC WEBPACK CONFIG.

const ExtractTextPlugin = require("extract-text-webpack-plugin");

const staticWebpackConfig = (config, { defaultLoaders, stage }) => {
  let loaders = [];

  if (stage === "dev") {
    loaders = [
      { loader: "style-loader" },
      { loader: "css-loader" },
      { loader: "sass-loader" }
    ];
  } else {
    loaders = [
      {
        loader: "css-loader",
        options: {
          importLoaders: 1,
          minimize: stage === "prod",
          sourceMap: false
        }
      },
      {
        loader: "sass-loader",
        options: { includePaths: ["src/"] }
      }
    ];

    // Don't extract css to file during node build process
    if (stage !== "node") {
      loaders = ExtractTextPlugin.extract({
        fallback: {
          loader: "style-loader",
          options: {
            sourceMap: false,
            hmr: false
          }
        },
        use: loaders
      });
    }
  }

  config.module.rules = [
    {
      oneOf: [
        {
          test: /\.s?(a|c)ss$/,
          use: loaders
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: "url-loader",
              options: {
                limit: Number.MAX_SAFE_INTEGER
              }
            }
          ]
        },
        {
          test: /\.md$/,
          use: "raw-loader"
        },
        defaultLoaders.cssLoader,
        defaultLoaders.jsLoader,
        defaultLoaders.fileLoader
      ]
    }
  ];
  return config;
};

module.exports = staticWebpackConfig;
