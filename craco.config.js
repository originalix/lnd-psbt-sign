// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

module.exports = {
  webpack: {
    plugins: [
      // Work around for Buffer is undefined:
      // https://github.com/webpack/changelog-v5/issues/10
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.wasm$/,
          type: 'webassembly/sync',
        },
      ],
    },
    configure: (webpackConfig, { env, paths }) => {
      console.log(webpackConfig);
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          stream: false,
          assert: false,
          buffer: require.resolve('buffer'),
        },
      };
      webpackConfig.experiments = {
        // asyncWebAssembly: true,
        // layers: true,
        // lazyCompilation: true,
        // outputModule: true,
        syncWebAssembly: true,
        // topLevelAwait: true,
      };
      return webpackConfig;
    },
    // configure: {
    //   resolve: {
    //     extensions: ['.ts', '.js'],
    //     fallback: {
    //       stream: false,
    //       assert: false,
    //       buffer: require.resolve('buffer'),
    //     },
    //   },
    //   experiments: {
    //     asyncWebAssembly: true,
    //     syncWebAssembly: true,
    //   },
    // },
  },
};
