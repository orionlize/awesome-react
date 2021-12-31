class DefinePlugin {
  /**
   * @typedef Option
   * @type {Object}
   * @property {Object} regex
   */
  /**
   *
   * @param {Option} options
   */
  constructor(options) {
    this.options = options;
  }

  apply(pack) {
    pack.hooks.beforeParse.tap('DefinePlugin', (target, code, callback) => {
      for (const regex in this.options.regex) {
        if (Reflect.has(this.options.regex, regex)) {
          code = code.replaceAll(regex, this.options.regex[regex]);
        }
      }
      callback(code);
    });
  }
}

module.exports = DefinePlugin;
