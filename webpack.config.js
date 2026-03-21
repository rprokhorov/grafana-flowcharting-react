const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

// Grafana 10 loads plugins via SystemJS — module must be UMD/commonjs
// and all @grafana/* / react / react-dom must be treated as externals
// (Grafana provides them at runtime).

const GRAFANA_EXTERNALS = {
  react: 'react',
  'react-dom': 'react-dom',
  '@grafana/data': '@grafana/data',
  '@grafana/ui': '@grafana/ui',
  '@grafana/runtime': '@grafana/runtime',
  '@grafana/schema': '@grafana/schema',
  'lodash': 'lodash',
};

module.exports = {
  mode: 'production',
  target: 'web',
  entry: './src/module.ts',
  output: {
    filename: 'module.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'amd',
    clean: true,
  },
  externals: GRAFANA_EXTERNALS,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        // Copy draw.io viewer library and all stencils into dist/static/libs/
        { from: 'src/static', to: 'static' },
        // Grafana requires plugin.json at the plugin root
        { from: 'plugin.json', to: '.' },
      ],
    }),
  ],
  optimization: {
    minimize: false, // Easier to debug; set true for prod
  },
};
