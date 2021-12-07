class TestPlugin {
  constructor() {

  }

  apply(pack) {
    pack.hooks.emit.tap('emit', (target) => {
      console.log('run start!');
    });
  }
}

module.exports = TestPlugin;
