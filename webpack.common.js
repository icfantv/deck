const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpack = require('webpack');
const {
  DllPlugin,
  LoaderOptionsPlugin,
  ProgressPlugin,
} = require('webpack');

const path = require('path');
const _root = path.resolve(__dirname);
function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [_root].concat(args));
}

const NODE_MODULE_PATH = path.join(__dirname, 'node_modules');
const fs = require('fs');

const EVENT = process.env.npm_lifecycle_event || '';
const DLL = EVENT.includes('dll');

const DLL_VENDORS = [
  'jquery',
  'angular',
  'angular-ui-bootstrap',
  'angular-ui-router',
  'source-sans-pro',
  'angular-cache',
  'angular-marked',
  'angular-messages',
  'angular-sanitize',
  'bootstrap',
  'clipboard',
  'd3',
  'jquery-ui',
  'moment-timezone',
  'rxjs'
];

function configure(IS_TEST) {

  const config = {
    plugins: [
      new ProgressPlugin()
    ],
    output: IS_TEST ? {} : {
        path: path.join(__dirname, 'build', 'webpack', process.env.SPINNAKER_ENV || ''),
        filename: '[name].js',
      },
    resolveLoader: IS_TEST ? {} : {
        modules: [
          NODE_MODULE_PATH
        ],
        moduleExtensions: ['-loader']
      },
    resolve: {
      extensions: ['.json', '.js', '.ts', '.css', '.less', '.html'],
      modules: [
        NODE_MODULE_PATH,
        path.join(__dirname, 'app', 'scripts', 'modules'),
      ]
    },
    module: {
      rules: [
        { enforce: 'pre', test: IS_TEST ? /\.spec.ts$/ : /\.ts$/, use: 'tslint-loader' },
        {
          test: require.resolve('jquery'),
          use: [
            'expose-loader?$',
            'expose-loader?jQuery'
          ]
        },
        { test: /\.json$/, loader: 'json-loader' },
        { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
        {
          test: /\.js$/,
          exclude: /node_modules(?!\/clipboard)/,
          use: [
            'ng-annotate-loader',
            'angular-loader',
            'babel-loader',
            'envify-loader',
            'eslint-loader'
          ]
        },
        {
          test: /\.less$/,
          use: [
            'style-loader',
            'css-loader',
            'less-loader'
          ]
        },
        {test: /\.(woff|otf|ttf|eot|svg|png|gif|ico)(.*)?$/, use: 'file-loader'},
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.html$/,
          use: [
            'ngtemplate-loader?relativeTo=' + (path.resolve(__dirname)) + '/',
            'html-loader'
          ]
        }
      ],
    },
    devServer: IS_TEST ? {} : {
        port: process.env.DECK_PORT || 9000,
        host: process.env.DECK_HOST || 'localhost',
        https: process.env.DECK_HTTPS === 'true'
      },
    watch: IS_TEST
  };

  if (process.env.DECK_CERT) {
    config.devServer.cert = fs.readFileSync(process.env.DECK_CERT);
    config.devServer.key = fs.readFileSync(process.env.DECK_KEY);
    if (process.env.DECK_CA_CERT) {
      config.devServer.cacert = fs.readFileSync(process.env.DECK_CA_CERT);
    }
  }

  if (DLL) {

    config.plugins.push(
      new DllPlugin({
        name: '[name]',
        path: root('dll/[name]-manifest.json'),
      })
    );

    config.entry = {
      vendor: [...DLL_VENDORS],
      settings: ['./settings.js']
    };
    config.output = {
      path: root('dll'),
      filename: '[name].dll.js',
      library: '[name]'
    }
  } else if (!IS_TEST) {

    config.entry = {
      settings: './settings.js',
      app: './app/scripts/app.js',
      vendor: [
        'jquery', 'angular', 'angular-ui-bootstrap', 'angular-ui-router',
        'source-sans-pro', 'angular-cache', 'angular-marked', 'angular-messages', 'angular-sanitize',
        'bootstrap', 'clipboard', 'd3', 'jquery-ui', 'moment-timezone', 'rxjs'
      ]
    };

    config.plugins.push(new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: 'vendor.bundle.js' }));
    config.plugins.push(new webpack.optimize.CommonsChunkPlugin('init'));
    config.plugins.push(new HtmlWebpackPlugin({
      title: 'Spinnaker',
      template: './app/index.deck',
      favicon: 'app/favicon.ico',
      inject: true,

      // default order is based on webpack's compile process with the migration to webpack two, we need this or
      // settings.js is put at the end of the <script> blocks which breaks the booting of the app.
      chunksSortMode: (a, b) => {
        const chunks = ['init', 'vendor', 'settings', 'app'];
        return chunks.indexOf(a.names[0]) - chunks.indexOf(b.names[0]);
      }
    }));

    config.plugins.push(new CopyWebpackPlugin([{from: 'dll'}]));
  }

  // this is temporary and will be deprecated in WP3.  moving forward,
  // loaders will individually need to accept this as an option.
  config.plugins.push(new LoaderOptionsPlugin({debug: !IS_TEST}));

  return config;
}

module.exports = configure;
