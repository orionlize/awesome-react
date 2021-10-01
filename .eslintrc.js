module.exports = {
  'env': {
    'browser': true,
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'rules': {
    'require-jsdoc': 0,
    'max-len': 0,
    'no-unused-vars': [
      'error', {
        'varsIgnorePattern': 'Awesome',
        'args': 'none',
      },
    ],
  },
};
