const TestPlugin = require('./plugin/test');

module.exports = [
  {
    input: './test/index.js',
    output: './source',
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
  },
];
