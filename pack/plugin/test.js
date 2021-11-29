class TestPlugin {
  constructor() {

  }

  apply(pack) {
    pack.hooks.run.tap('test', () => {
      console.log('run start!');
    });
  }
}

module.exports = TestPlugin;
