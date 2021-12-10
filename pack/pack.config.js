const TestPlugin = require('./plugin/test');

module.exports = {
  input: ['./test/index.js'],
  output: 'build',
  resolve: ['.js'],
  esmodules: true,
  sourceMap: true,
  format: 'cjs',
  jsx: true,
  loaders: [
    {
      loader: require('./loader/test'),
      test: /.js$/,
    },
  ],
  plugins: [
    new TestPlugin(),
  ],
};
