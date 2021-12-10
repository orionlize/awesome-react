class TestPlugin {
  constructor() {

  }

  apply(pack) {
    pack.hooks.emit.tap('emit', (target) => {
      debugger;
    });
  }
}

module.exports = TestPlugin;
