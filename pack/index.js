const configPath = process.argv[2];
const configs = require(configPath);

if (!configs) {
  console.error('pack config is null!');

  return -1;
}

const Compiler = require('./compiler');
class JSPack {
  constructor(options) {
    const packOptions = this._mergeOptions(options);
    const compiler = new Compiler(packOptions);
    return compiler;
  }

  _mergeOptions(options) {
    const argvs = process.argv.slice(3);
    for (const argv of argvs) {
      const [key, value] = argv.split('=');
      if (key && value) {
        options[key] = value;
      }
    }
    return options;
  }
}

for (const options of configs) {
  const pack = new JSPack(options);
  pack.run();
}

module.exports = JSPack;
