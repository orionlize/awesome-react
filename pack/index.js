const fs = require('fs');
const esprima = require('esprima');
const path = require('path');

const content = fs.readFileSync(path.resolve(__dirname, 'test', 'index.js'), {
  encoding: 'utf-8',
});

console.log(esprima.parseModule(content));
