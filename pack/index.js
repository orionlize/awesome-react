const configPath = process.argv[2];
const configs = require(configPath);

if (!configs) {
  console.error('pack config is null!');

  return -1;
}

const Filter = require('./filter');
const Generator = require('./generator');
const Emitter = require('./emitter');
const {writeFileSync} = require('fs');
class Pack {
  constructor(config) {
    this.config = config;
    this.emitter = new Emitter();
    config.plugins.forEach((plugin) => {
      plugin.apply(this);
    });
  }

  parse() {
    const {
      modules,
      defaultMap,
    } = new Filter(this.config.input, this.config.loaders, {
      jsx: this.config.jsx,
    }).filter(this.emitter);
    const bundle = new Generator(defaultMap).generate(modules, this.emitter);
    const fileName = /\/(.+)$/.exec(this.config.input)[1];
    const map = bundle.generateMap({
      source: `${fileName}`,
      file: `${fileName}.map`,
      includeContent: true,
    });

    this.emitter.emit('beforeWriting', bundle);
    writeFileSync(this.config.output, '\'use strict\';' + bundle.toString());
    writeFileSync(`${this.config.output}.map`, map.toString());
    this.emitter.emit('afterWriting');
  }
}

for (const config of configs) {
  new Pack(config).parse();
}
