const styles = require('./color');

class MeasureSpeedPlugin {
  apply(pack) {
    pack.hooks.done.tap('MeasureSpeedPlugin', (target) => {
      target.observer.notify = (target) => {
        target.records.forEach((val, key) => {
          console.log(styles.yellow, key, styles.default, 'spends ', styles.yellow, ~~(val * 1000) / 1000, styles.default, 'ms');
        });
        console.log(styles.default, 'It takes a total of ', ~~((styles.yellow, target.end - target.start) * 1000) / 1000, styles.default, 'ms');
      };
    });
  }
}

module.exports = MeasureSpeedPlugin;
