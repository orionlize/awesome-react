const TestPlugin = require('./plugin/test');

module.exports = {
  input: ['./test/index.js'],
  output: 'build',
  resolve: ['.js'],
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
