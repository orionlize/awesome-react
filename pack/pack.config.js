const TestPlugin = require('./plugin/pack-split-plugin');

module.exports = {
  input: [
    './test/index.js',
    './test/index2.js',
  ],
  output: 'build',
  resolve: ['.js'],
  esmodules: true,
  sourceMap: true,
  format: 'iife',
  jsx: true,
  loaders: [
    {
      loader: require('./loader/test'),
      test: /.js$/,
    },
  ],
  plugins: [
    new TestPlugin({}),
  ],
};
