const {performance, PerformanceObserver} = require('perf_hooks');

class PerformanceProfile {
  constructor() {
    this.records = new Map();
    this.start = -1;
    this.end = -1;
    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((obs) => {
        const record = this.records.get(obs.name);
        if (obs.entryType === 'function') {
          if (record) {
            this.records.set(obs.name, obs.duration + record);
          } else {
            this.records.set(obs.name, obs.duration);
          }
        } else {
          if (this.start === -1) {
            this.start = obs.startTime;
          } else {
            this.end = obs.startTime;
          }
        }
      });
      this.notify(this);
      this.observer.disconnect();
    });
    this.observer.observe({entryTypes: ['function', 'mark']});
  }

  notify = (target) => {

  }

  /**
   * 观测函数的执行时间
   * @param {Function} fn
   * @return {any}
   */
  observe(fn) {
    const wrapped = performance.timerify(fn);
    return wrapped;
  }
  /**
   * @typedef Option
   * @type {Object}
   * @property {any} detail
   * @property {number} startNumber
   *
   */
  /**
   * 性能打点
   * @param {String} name
   * @param {Option} options
   */
  mark(name, options) {
    performance.mark(name, options);
  }
}

module.exports = new PerformanceProfile();
