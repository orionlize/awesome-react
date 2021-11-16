class TestPlugin {
  constructor() {

  }

  apply(pack) {
    pack.emitter.addListener('parseEnd', (...args) => {
      console.log(args);
    });
  }
}

module.exports = TestPlugin;
