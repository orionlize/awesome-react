class Emitter {
  constructor() {
    this.listeners = {};
  }

  addListener(name, cb) {
    if (this.listeners[name]) {
      this.listeners[name].add(cb);
    } else {
      this.listeners[name] = [cb];
    }
  }

  removeListener(name, cb) {
    if (this.listeners[name]) {
      this.listeners[name].forEach((listener, i) => {
        if (listener === cb) {
          this.listeners[name].splice(i, 1);
        }
      });
      if (this.listeners[name].length === 0) {
        this.listeners[name] = null;
      }
    }
  }

  emit(name, args) {
    if (this.listeners[name]) {
      this.listeners[name].forEach((cb) => {
        cb(args);
      });
    }
  }
}

module.exports = Emitter;
