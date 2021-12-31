const DefinePlugin = require('./plugin/define-plugin');
const MeasureSpeedPlugin = require('./plugin/measure-speed-plugin');
const TestPlugin = require('./plugin/pack-split-plugin');

module.exports = {
  input: [
    './test/index.jsx',
    './test/index2.js',
  ],
  output: 'build',
  resolve: ['.js'],
  format: 'iife',
  jsx: true,
  mode: 'production',
  loaders: [
    {
      loader: require('./loader/test'),
      test: /.js$/,
    },
  ],
  plugins: [
    new TestPlugin({}),
    new DefinePlugin({
      regex: {
        'process.env.NODE_ENV': '\'production\'',
        '__REACT_DEVTOOLS_GLOBAL_HOOK__': 'undefined',
      },
    }),
    new MeasureSpeedPlugin({}),
  ],
};
