const {JSDOM} = require('jsdom');
const window = (new JSDOM(``, {pretendToBeVisual: true})).window;

class Scope {
  constructor(options = {}) {
    this.parent = options.parent;
    this.depth = this.parent ? this.parent.depth + 1 : 0;
    this.names = new Map();
    this.isBlockScope = options.block;
    this.deps = new Map();
    this.alias = new Map();
  }

  add(name, isBlockDeclaration) {
    if (!isBlockDeclaration && this.isBlockScope) {
      this.parent.add(name, isBlockDeclaration);
    } else {
      this.names.set(name, false);
      this.deps.set(name, []);
    }
  }

  addDeps(name, node) {
    if (this.deps.has(name)) {
      const deps = this.deps.get(name);
      deps.push(node);
    } else {
      if (this.parent) {
        this.parent.addDeps(name, node);
      }
    }
  }

  addAlias(name, other, module) {
    this.alias.set(name, [module, other]);
  }

  contain(name, node) {
    if (this.names.has(name)) {
      this.names.set(name, true);
      return true;
    } else {
      if (this.parent) {
        return this.parent.contain(name, node);
      } else {
        return Reflect.has(window, name) || Reflect.has(globalThis, name);
      }
    }
  }

  findNotBlock() {
    if (this.parent) {
      if (!this.parent.isBlockScope) {
        return this.parent;
      } else {
        return this.parent.findNotBlock();
      }
    } else {
      return this;
    }
  }
}

module.exports = Scope;
