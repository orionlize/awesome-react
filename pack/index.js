// 'use strict';

const {JSDOM} = require('jsdom');
const window = (new JSDOM(``, {pretendToBeVisual: true})).window;

const fs = require('fs');
const esprima = require('esprima');
const path = require('path');
const {default: MagicString} = require('magic-string');
class Scope {
  constructor(options = {}) {
    this.parent = options.parent;
    this.depth = this.parent ? this.parent.depth + 1 : 0;
    this.names = options.params || new Map();
    this.isBlockScope = options.block;
  }

  add(name, isBlockDeclaration) {
    if (!isBlockDeclaration && this.isBlockScope) {
      this.parent.add(name, isBlockDeclaration);
    } else {
      this.names.set(name, false);
    }
  }

  contain(name) {
    if (this.names.has(name)) {
      this.names.set(name, true);
      return name;
    } else {
      if (this.parent) {
        return this.parent.contain(name);
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

const content = fs.readFileSync(path.resolve(__dirname, 'test', 'index.js'), {
  encoding: 'utf-8',
});

function parseModule(input, config) {
  return esprima.parseModule(input, config, function(node, meta) {
  });
}

const modules = parseModule(content);
modules._scope = new Scope();

function recursionModule(node, parent, exports) {
  setScope(node, parent);
  if (node.type === 'ImportDeclaration') {
    const relative = node.source.value;
    node.body = [];
    node.exports = new Set();
    const _content = fs.readFileSync(path.resolve(__dirname, 'test', `${relative}.js`), {
      encoding: 'utf-8',
    });
    const _modules = parseModule(_content).body;

    for (let j = 0; j < _modules.length; ++ j) {
      const _node = _modules[j];
      const ret = recursionModule(_node, node, node.exports);
      node.body.push(ret);
    }

    return node;
  } else {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        exports.add(node.declaration.id.name);
        recursionModule(node.declaration, parent, exports);
      }
      if (Array.isArray(node.specifiers)) {
        for (const specifier of node.specifiers) {
          exports.add(specifier.exported.name);
        }
      }
    }
    return node;
  }
}

scope = new Scope();

modules._scope = new Scope({
  parent: scope,
  block: true,
});

for (const node of modules.body) {
  recursionModule(node, modules);
}

function setScope(node, parent) {
  node._scope = new Scope({
    parent: parent._scope,
    block: node.type === 'ImportDeclaration' || node.type === 'ForStatement' || node.type === 'BlockStatement' || node.type === 'ExportNamedDeclaration',
  });
  if (node.type === 'VariableDeclaration') {
    for (const declaration of node.declarations) {
      parent._scope.add(declaration.id.name, node.kind !== 'var');
    }
  }
  if (node.type === 'FunctionDeclaration') {
    parent._scope.add(node.id.name, false);
  }
  if (node.type === 'ImportDeclaration') {
    for (const specifier of node.specifiers) {
      parent._scope.add(specifier.local.name, false);
    }
  }

  for (const attribute in node) {
    if (node[attribute] && typeof node[attribute] === 'object' && !/^_/.test(attribute)) {
      if (Array.isArray(node[attribute])) {
        for (const _node of node[attribute]) {
          setScope(_node, node);
        }
      } else {
        setScope(node[attribute], node);
      }
    }
  }
}

function findDependencies(node, dependencies) {
  if (node.type === 'Identifier') {
    if (!node._scope.contain(node.name)) {
      dependencies.add(node.name);
    }
  }
  if (node.type === 'Program' || node.type === 'ImportDeclaration') {
    const imports = node.body.filter((m) => m.type === 'ImportDeclaration');
    const notImports = node.body.filter((m) => m.type !== 'ImportDeclaration');

    const _dependencies = new Set();
    for (const _node of notImports) {
      findDependencies(_node, _dependencies);
    }

    const used = new Set(node._scope.names.keys((key) => node._scope.names.get(key)));
    const prev = node._scope.findNotBlock();
    const notBlockUsed = new Set(prev.names.keys((key) => prev.names.get(key)));

    for (const _node of imports) {
      const exportNode = _node.body.filter((n) => n.type === 'ExportNamedDeclaration');
      for (const __node of exportNode) {
        // 添加变量的判断
        if (__node.declaration) {
          if (__node.type === 'FunctionDeclaration') {
            if (notBlockUsed.has(__node.declaration.id.name)) {
              _node._scope.names.set(__node.declaration.id.name, true);
            }
          } else if (__node.type === 'VariableDeclaration') {
            for (const declaration of __node.declarations) {
              if (node.kind !== 'var') {
                if (used.has(declaration.id.name)) {
                  _node.scope.names.set(declaration.id.name, true);
                }
              } else {
                if (notBlockUsed.has(declaration.id.name)) {
                  prev.names.set(declaration.id.name, true);
                }
              }
            }
          }
        } else {

        }
      }
    }
  }
  for (const attribute in node) {
    if ((node.type === 'VariableDeclarator' || node.type === 'FunctionDeclaration') && attribute === 'id') {
      continue;
    }
    if (attribute === 'property') {
      continue;
    }
    if (node.type === 'ImportDefaultSpecifier') {
      continue;
    }

    if (node[attribute] && typeof node[attribute] === 'object' && !/^_/.test(attribute)) {
      if (Array.isArray(node[attribute])) {
        for (const _node of node[attribute]) {
          findDependencies(_node, dependencies);
        }
      } else {
        findDependencies(node[attribute], dependencies);
      }
    }
  }
}

const dependencies = new Set();
findDependencies(modules, dependencies);

function build(node) {
  if (node._scope) {
    if (node.type === 'VariableDeclaration') {
      if (node.kind === 'var') {
        const prev = node._scope.findNotBlock();
        const notBlockUsed = new Set(Array.from(prev.names.keys()).filter((key) => prev.names.get(key)));
        node.declarations = node.declarations.filter((variable) => notBlockUsed.has(variable.id.name));
      } else {
        const used = new Set(node._scope.names.keys((key) => node._scope.names.get(key)));
        node.declarations = node.declarations.filter((variable) => used.has(variable.id.name));
      }
    } else if (node.type === 'FunctionDeclaration') {
      const prev = node._scope.findNotBlock();
      const notBlockUsed = new Set(Array.from(prev.names.keys()).filter((key) => prev.names.get(key)));
      node.body = notBlockUsed.has(node.id.name) ? node.body : [];
    }

    for (const attribute in node) {
      if (node[attribute] && typeof node[attribute] === 'object' && !/^_/.test(attribute)) {
        if (Array.isArray(node[attribute])) {
          for (const _node of node[attribute]) {
            build(_node, dependencies);
          }
        } else {
          build(node[attribute], dependencies);
        }
      }
    }
  }
}

build(modules);

debugger;

const code = new MagicString('');

function transform(modules) {
  (Array.isArray(modules) ? modules : [modules]).forEach((module) => {
    if (module.type === 'VariableDeclaration') {
      code.append(`${module.kind} `);
      for (let i = 0; i < module.declarations.length; ++ i) {
        const declaration = module.declarations[i];
        transform(declaration.id);
        code.append('=');
        transform(declaration.init);
        code.append(';');
      }
    } else if (module.type === 'ExpressionStatement') {
      transform(module.expression);
      code.append(';');
    } else if (module.type === 'BinaryExpression') {
      if (module.left.body) {
        transform(module.left.body);
      } else {
        transform(module.left);
        code.append(module.operator);
        transform(module.right);
      }
    } else if (module.type === 'CallExpression') {
      if (module.callee.name) {
        code.append(`${module.callee.name}`);
      } else {
        transform(module.callee);
      }
      code.append('(');
      if (module.arguments) {
        for (let i = 0; i < module.arguments.length; ++ i) {
          transform(module.arguments[i]);
          if (i < module.arguments.length -1) {
            code.append(',');
          }
        }
      }
      code.append(')');
    } else if (module.type === 'MemberExpression') {
      transform(module.object);
      code.append('.');
      transform(module.property);
    } else if (module.type === 'FunctionDeclaration') {
      code.append(`function ${module.id.name}(`);
      transform(module.params);
      code.append(')');
      transform(module.body);
    } else if (module.type === 'BlockStatement') {
      code.append('{');
      transform(module.body);
      code.append('};');
    } else if (module.type === 'ReturnStatement') {
      code.append(`return `);
      transform(module.argument);
      code.append(';');
    } else if (module.type === 'Identifier') {
      code.append(module.name);
    } else if (module.type === 'Literal') {
      code.append(String(module.value));
    } else if (module.type === 'ImportDeclaration') {
      let defaultExport = '';
      const exports = [];
      for (const specifier of module.specifiers) {
        if (specifier.type === 'ImportDefaultSpecifier') {
          defaultExport = specifier.local.name;
        } else {
          exports.push(specifier.imported.name);
        }
      }

      if (defaultExport) {
        code.append(`var ${defaultExport} = (function () {`);
        transform(module.body);
        code.append(`return {${module.exports.join(',')}}})();`);
        if (exports) {
          code.append(`var {${exports.join(',')}}=${defaultExport};`);
        }
      } else {
        code.append(`var {${exports.join(',')}}=(function () {`);
        transform(module.body);
        code.append(`return {${module.exports.join(',')}}})();`);
      }
    } else if (module.type === 'ExportNamedDeclaration') {
      if (module.declaration) {
        transform(module.declaration);
      }
      if (Array.isArray(module.body)) {
        transform(module.body);
      }
    } else {
      if (Array.isArray(module.body)) {
        transform(module.body);
      }
    }
  });
}

transform(modules.body);

const map = code.generateMap({
  source: 'source.js',
  file: 'source.js.map',
  includeContent: true,
});

fs.writeFileSync('./source.js', code.toString());
fs.writeFileSync('./source.js.map', map.toString());
