const {SyncHook} = require('tapable');
const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const types = require('@babel/types');

const fs = require('fs');
const path = require('path');
const {getEntry, tryExpression} = require('./helper');

class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new SyncHook(),
      emit: new SyncHook(),
      done: new SyncHook(),
    };
    this.entries = new Set();
    this.modules = new Map();
    this.chunks = new Set();
    this.assets = new Set();
    this.files = new Set();
    options.plugins.forEach((plugin) => {
      plugin.apply(this);
    });
  }

  _buildModule(modulePath, originModulePath = '', moduleContext = '') {
    const _modulePath = tryExpression(modulePath, originModulePath, this.options.resolve, moduleContext);
    if (this.modules.has(_modulePath)) {
      return this.modules.get(_modulePath);
    }
    const content = fs.readFileSync(
        _modulePath,
        {
          encoding: 'utf-8',
        },
    );

    const module = {
      moduleId: _modulePath,
      dependencies: new Set(),
      name: [originModulePath],
    };
    this.options.loaders.reverse().forEach((item) => {
      if (item.test.test(_modulePath)) {
        item.loader(content);
      }
    });
    const ast = parse(content, {
      sourceType: 'module',
      sourceFilename: modulePath,
    });
    traverse(ast, {
      ImportDeclaration: (nodePath) => {
        const rootPath = nodePath.parent.loc.filename.split('/').slice(0, -1).join('/');
        const subModulePath = path.resolve(rootPath, nodePath.node.source.extra.rawValue);
        module.dependencies.add(
            this._buildModule(subModulePath, nodePath.node.source.extra.rawValue, _modulePath).moduleId,
        );
      },
      CallExpression: (nodePath) => {
        if (nodePath.node.callee.name === 'require') {
          const rootPath = nodePath.parent.loc.filename.split('/').slice(0, -1).join('/');
          const subModulePath = path.resolve(rootPath, nodePath.node.arguments[0].value);
          module.dependencies.add(
              this._buildModule(subModulePath, nodePath.node.arguments[0].value, _modulePath).moduleId,
          );
        }
      },
    });

    this.modules.set(_modulePath, module);

    const {code} = generate(ast);
    module._source = code;
    return module;
  }

  run(callback) {
    this.hooks.run.call();
    this._buildModule(getEntry(this.options));
    debugger;
  }
}

module.exports = Compiler;
