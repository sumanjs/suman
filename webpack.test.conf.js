const path = require('path');

module.exports = {

  entry: ['babel-polyfill', './lib/index.js'],

  output: {
    path: path.resolve(__dirname + '/dist'),
    filename: 'suman.js'
  },

  module: {

    rules: [
      // all files with a `.ts` extension will be handled by `ts-loader`
      {
        test: /^\.d.ts$/,
        loader: 'ignore-loader'
      },
      {
        test: new RegExp('^' + path.resolve(__dirname + '/lib/cli-commands/') + '.*'),
        loader: 'ignore-loader'
      },
      {
        test: new RegExp('^' + path.resolve(__dirname + '/suman.conf.js')),
        loader: 'ignore-loader'
      }
    ],
    loaders: [
      // {
      //   test: /\.js$/,
      //   loader: 'babel-loader',
      //   exclude: /node_modules/,
      //   options: {
      //     presets: ['latest'],
      //     plugins: ['transform-runtime']
      //   }
      // },
      {
        test: /(\/lib\/init\/|cli.js$)/,
        loader: 'ignore-loader'
      }
    ]
  },

  resolve: {
    alias: {
      fs: require.resolve('suman-browser-polyfills/modules/fs'),
      // assert: require.resolve('suman-browser-polyfills/modules/assert'),
      process: require.resolve('suman-browser-polyfills/modules/process'),
    },
    extensions: ['.js']
  },

  // packages: {
  //   'suman-browser-polyfills': {
  //     main: require.resolve('suman-browser-polyfills'),
  //   },
  //   'suman-utils': {
  //     main: require.resolve('suman-utils'),
  //   },
  //   'suman-events': {
  //     main: require.resolve('suman-events'),
  //   },
  //   'suman-debug': {
  //     main: require.resolve('suman-debug'),
  //   }
  // },

  node: {
    assert: true,
    buffer: false,
    child_process: 'empty',
    cluster: 'empty',
    console: false,
    constants: true,
    crypto: 'empty',
    dgram: 'empty',
    dns: 'mock',
    domain: true,
    events: true,
    // fs: 'empty',
    http: true,
    https: true,
    module: 'empty',
    net: 'mock',
    os: true,
    path: true,
    process: false,
    punycode: true,
    querystring: true,
    readline: 'empty',
    repl: 'empty',
    stream: true,
    string_decoder: true,
    timers: true,
    tls: 'mock',
    tty: true,
    url: true,
    util: true,
    v8: 'mock',
    vm: true,
    zlib: 'empty',
  }
};
