class TestPlugin {
  /**
   * @typedef Option
   * @type {Object}
   * @property {Function} split
   */
  /**
   *
   * @param {Option} options
   */
  constructor(options) {
    this.options = options || {};
    this.options.split ?? (() => {
      this.options.split = (modules) => (Array.from(modules.values()));
    })();
  }

  apply(pack) {
    pack.hooks.emit.tap('emit', (target) => {
      target.merge(this.options.split(target.modules));
    });
  }
}

module.exports = TestPlugin;
