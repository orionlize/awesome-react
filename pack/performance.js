const {performance, PerformanceObserver} = require('perf_hooks');

class PerformanceProfile {
  constructor() {
    this.observer = new PerformanceObserver((list) => {
      console.log(list);
    });
    this.observer.observe({entryTypes: ['function']});
  }

  observe(fn) {
    const wrapped = performance.timerify(fn);
    wrapped();
  }
}

module.exports = new PerformanceProfile();
