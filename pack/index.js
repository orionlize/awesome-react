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

const content = fs.readFileSync(path.resolve(__dirname, 'test', 'index.js'), {
  encoding: 'utf-8',
});

function parseModule(input, config) {
  return esprima.parseModule(input, config, function(node, meta) {
  });
}

const modules = parseModule(content);
const moduleMap = new Map();
const defualtMap = new Map();

function recursionModule(node, parent) {
  if (node.type === 'ImportDeclaration') {
    const relative = node.source.value;
    if (moduleMap.has(relative)) {
      return moduleMap.get(relative);
    } else {
      node.specifiers.map((specifier) => {
        moduleMap.set(relative, node);
        setScope(node, parent);
      });
    }
    node.body = [];

    const _modules = parseModule(fs.readFileSync(path.resolve(__dirname, 'test', `${relative}.js`), {
      encoding: 'utf-8',
    })).body;

    let defaultExport = '';
    for (let i = 0; i < _modules.length; ++ i) {
      const _node = _modules[i];
      const ret = recursionModule(_node, node, node._exports);
      node.body.push(ret);
      if (ret.type === 'ExportDefaultDeclaration') {
        if (ret.declaration.type === 'Identifier') {
          defaultExport = ret.declaration.name;
        }
      }
    }

    const exports = [];
    _modules.forEach((module) => {
      if (module.type === 'ExportNamedDeclaration') {
        for (const specifier of module.specifiers) {
          exports.push(specifier.exported.name);
        }
      }
    });
    node.specifiers.forEach((specifier) => {
      if (specifier.type === 'ImportDefaultSpecifier') {
        exports.push(specifier.local.name);
      }
    });
    node._exports = new Set(exports);
    node._imports = [];
    for (const importNode of node.body) {
      if (importNode.type === 'ImportDeclaration') {
        node._imports = node._imports.concat(importNode.specifiers.map((specifier) => specifier.imported ? specifier.imported.name : specifier.local.name));
      }
    }
    node._imports = new Set(node._imports);
    const exportNodes = new Map();

    node.body.forEach((n) => {
      if (n.type === 'VariableDeclaration') {
        const declarations = n.declarations.filter((_n) => node._exports.has(_n.id.name) || defaultExport === _n.id.name);
        if (declarations.length > 0) {
          for (const _n of declarations) {
            exportNodes.set(_n.id.name, _n.id);
          }
        }
      } else if (n.type === 'FunctionDeclaration') {
        if (node._exports.has(n.id.name) || defaultExport === n.id.name) {
          exportNodes.set(n.id.name, n.id);
        }
      } else if (n.type === 'ExportNamedDeclaration') {
        if (n.declaration) {
          if (n.declaration.type === 'VariableDeclaration') {
            declarations = n.declaration.declarations.filter((_n) => node._exports.has(_n.id.name));
            if (declarations.length > 0) {
              for (const _n of declarations) {
                exportNodes.set(_n.id.name, _n.id);
              }
            }
          } else if (n.declaration.type === 'FunctionDeclaration') {
            if (node._exports.has(n.declaration.id.name)) {
              exportNodes.set(n.declaration.id.name, n.declaration.id);
            }
          }
        }
      } else if (n.type === 'ImportDeclaration') {
        if (n._exports.has(defaultExport)) {
          exportNodes.set(defaultExport, n);
        } else {
          n._exports.forEach((name) => {
            if (node._exports.has(name) || (n._defaultExport && n._defaultExport.has(name))) {
              exportNodes.set(name, n);
            }
          });
        }
      }
    });

    node._exportNodes = exportNodes;
    if (defaultExport) {
      const _default = exportNodes.get(defaultExport);
      defualtMap.set(relative, _default.type === 'ImportDeclaration' ?
      (defualtMap.get(_default.source.value) || _default._exportNodes.get(defaultExport)) :
      _default);
    }
    if (node._default && !node._default._name) {
      node._default._name = node._default.name;
      node._default.name = node._defaultExport.entries().next().value[1];
    }
  } else {
    setScope(node, parent);
  }
  return node;
}

scope = new Scope({
  block: false,
});

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
    block: node.type !== 'FunctionExpression' && node.type !== 'FunctionDeclaration' && node.type !== 'ImportDeclaration',
  });
  if (node.type === 'VariableDeclaration') {
    for (const declaration of node.declarations) {
      parent._scope.add(declaration.id.name, node.kind !== 'var');
      parent._scope.addDeps(declaration.id.name, declaration.id);
    }
  }
  if (node.type === 'FunctionDeclaration') {
    parent._scope.add(node.id.name, false);
    for (const param of node.params) {
      node._scope.add(param.name, true);
    }
  }
  if (node.type === 'ImportDeclaration') {
    for (const specifier of node.specifiers) {
      parent._scope.add(specifier.local.name, true);
      if (specifier.imported && specifier.imported.name !== specifier.local.name) {
        parent._scope.addAlias(specifier.imported.name, specifier.local.name, node.source);
      }
    }
  }
  if (node.type === 'ArrowFunctionExpression') {
    for (const param of node.params) {
      node._scope.add(param.name, true);
    }
  }
  if (node.type === 'ExportDefaultDeclaration') {
    node._scope.add(parent._defaultExport, true);
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

let cache = [];
function findDependencies(node) {
  if (node.type === 'Identifier') {
    node._scope.parent.contain(node.name, node);
    node._scope.parent.addDeps(node.name, node);
    return;
  }

  if (node.type === 'Program' || node.type === 'ImportDeclaration' || node.type === 'BlockStatement' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
    const len = cache.length;
    const body = Array.isArray(node.body) ? node.body : [node.body];
    for (const _node of body) {
      if (_node.type !== 'ImportDeclaration' && _node.type !== 'VariableDeclaration' && _node.type !== 'FunctionDeclaration') {
        findDependencies(_node);
      } else {
        cache.push(_node);
      }
    }
    if (cache.length !== len) {
      for (const _node of cache) {
        if (_node.type === 'ImportDeclaration') {
          const _cache = cache;
          cache = [];
          _node._exports.forEach((name) => {
            if (node._scope.names.has(name)) {
              const alias = node._scope.alias.get(name);
              let _name = name;
              if (alias) {
                if (alias[0] === _node.source) {
                  _name = alias[1];
                }
              }

              if (_node._defaultExport && _node._defaultExport.has(name)) {
                if (_node._default && _node._default.type === 'VariableDeclaration') {
                  _name = _node._default.declarations[0].id.name;
                } else if (_node._default && _node._default.type === 'FunctionDeclaration') {
                  _name = _node._default.id.name;
                }

                const deps = node._scope.deps.get(name);
                // deps.forEach((dep) => {
                //   if (!dep._name) {
                //     dep.name = cur._default.name;
                //   }
                // });

                debugger;
                _node._scope.deps.set(_node._default._name, _node._scope.deps.get(_node._default._name).concat(deps));
                if (name !== _name) {
                  node._scope.deps.set(_node._default.name, []);
                }
                _node._scope.names.set(_node._default._name, true);
                findDependencies(_node._exportNodes.get(_node._default._name));
              } else {
                const deps = node._scope.deps.get(_name);
                // deps.forEach((dep) => {
                //   if (!dep._name) {
                //     dep.name = name;
                //   }
                // });
                let cur = _node;
                while (cur._exportNodes && cur._exportNodes.has(name) && cur._exportNodes.get(name).type === 'ImportDeclaration') {
                  cur = cur._exportNodes.get(name);
                }
                if (cur._scope.deps.has(name)) {
                  cur._scope.deps.set(name, cur._scope.deps.get(name).concat(deps));
                  if (name !== _name) {
                    node._scope.deps.set(name, []);
                  }
                  cur._scope.names.set(name, true);
                  findDependencies(cur._exportNodes.get(name));
                }
              }
            }
          });
          cache = _cache;
        } else if (_node.type === 'FunctionDeclaration') {
          findDependencies(_node);
        } else if (_node.type === 'VariableDeclaration') {
          findDependencies(_node);
        }
      }
    }
    cache.length = len;
  } else {
    for (const attribute in node) {
      if (Reflect.has(node, attribute)) {
        if ((node.type === 'VariableDeclarator' || node.type === 'FunctionDeclaration') && attribute === 'id') {
          node._scope.parent.addDeps(node['id'].name, node['id']);
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
              findDependencies(_node);
            }
          } else {
            findDependencies(node[attribute]);
          }
        }
      }
    }
  }
}

debugger;

findDependencies(modules);

function build(node) {
  if (node._scope) {
    if (node.type === 'VariableDeclaration') {
      if (node.kind === 'var') {
        const prev = node._scope.findNotBlock();
        const notBlockUsed = new Set(Array.from(prev.names.keys()).filter((key) => prev.names.get(key)));
        node.declarations = node.declarations.filter((variable) => notBlockUsed.has(variable.id._name || variable.id.name));
      } else {
        const used = new Set(Array.from(node._scope.parent.names.keys()).filter((key) => node._scope.parent.names.get(key)));
        node.declarations = node.declarations.filter((variable) => used.has(variable.id._name || variable.id.name));
      }
    } else if (node.type === 'FunctionDeclaration') {
      const prev = node._scope.findNotBlock();
      const notBlockUsed = new Set(Array.from(prev.names.keys()).filter((key) => prev.names.get(key)));
      node.body = notBlockUsed.has(node.id._name || node.id.name) ? node.body : null;
    } else if (node.type === 'AssignmentExpression') {
      const prev = node._scope.findNotBlock();
      const notBlockUsed = new Set(Array.from(prev.names.keys()).filter((key) => prev.names.get(key)));
      const used = new Set(Array.from(node._scope.parent.names.keys()).filter((key) => node._scope.parent.names.get(key)));
      if (!notBlockUsed.has(node.left.name) && !used.has(node.left.name)) {
        node.deleted = true;
      }
    }

    for (const attribute in node) {
      if (node[attribute] && typeof node[attribute] === 'object' && !/^_/.test(attribute)) {
        if (Array.isArray(node[attribute])) {
          for (const _node of node[attribute]) {
            build(_node);
          }
        } else {
          build(node[attribute]);
        }
      }
    }
  }
}

build(modules);

const bundle = new MagicString('');
const importMap = new Set();
const importVariableMap = new Set();

function transform(modules, code) {
  (Array.isArray(modules) ? modules : [modules]).forEach((module) => {
    if (module.type === 'VariableDeclaration') {
      if (module.declarations.length > 0) {
        code.append(`${module.kind} `);
        for (let i = 0; i < module.declarations.length; ++ i) {
          const declaration = module.declarations[i];
          transform(declaration.id, code);
          code.append('=');
          transform(declaration.init, code);
          code.append(';');
        }
      }
    } else if (module.type === 'ExpressionStatement') {
      transform(module.expression, code);
      code.append(';');
    } else if (module.type === 'BinaryExpression') {
      if (module.left.body) {
        transform(module.left.body, code);
      } else {
        transform(module.left, code);
        code.append(module.operator);
        transform(module.right, code);
      }
    } else if (module.type === 'CallExpression') {
      if (module.callee.name) {
        code.append(`${module.callee.name}`);
      } else {
        transform(module.callee, code);
      }
      code.append('(');
      if (module.arguments) {
        for (let i = 0; i < module.arguments.length; ++ i) {
          transform(module.arguments[i], code);
          if (i < module.arguments.length -1) {
            code.append(',');
          }
        }
      }
      code.append(')');
    } else if (module.type === 'AssignmentExpression') {
      if (!module.deleted) {
        transform(module.left, code);
        code.append(module.operator);
        transform(module.right, code);
      }
    } else if (module.type === 'MemberExpression') {
      transform(module.object, code);
      code.append('.');
      transform(module.property, code);
    } else if (module.type === 'TryStatement') {
      code.append('try');
      if (module.block) {
        transform(module.block, code);
      }
      if (module.handler) {
        transform(module.handler, code);
      }
      if (module.finalizer) {
        code.append('finally');
        transform(module.finalizer, code);
      }
    } else if (module.type === 'CatchClause') {
      code.append(`catch(${module.param ? module.param.name : ''})`);
      if (module.body) {
        transform(module.body, code);
      }
    } else if (module.type === 'FunctionExpression') {
      code.append('function(');
      transform(module.params, code);
      code.append(')');
      transform(module.body, code);
    } else if (module.type === 'ArrowFunctionExpression') {
      code.append('(');
      transform(module.params, code);
      code.append(')=>');
      transform(module.body, code);
    } else if (module.type === 'FunctionDeclaration') {
      if (module.body) {
        code.append(`function ${module.id.name}(`);
        if (module.params) {
          for (let i = 0; i < module.params.length; ++ i) {
            transform(module.params[i], code);
            if (i < module.params.length -1) {
              code.append(',');
            }
          }
        }
        code.append(')');
        transform(module.body, code);
      }
    } else if (module.type === 'BlockStatement') {
      code.append('{');
      transform(module.body, code);
      code.append('}');
    } else if (module.type === 'IfStatement') {
      if (module.test) {
        code.append('if(');
        transform(module.test, code);
        code.append(')');
      }
      if (module.consequent) {
        transform(module.consequent, code);
      }
      if (module.alternate) {
        if (module.alternate.type === 'IfStatement') {
          code.append('else ');
          transform(module.alternate, code);
        } else {
          code.append('else');
          transform(module.alternate, code);
        }
      }
    } else if (module.type === 'SwitchStatement') {
      code.append('switch(');
      transform(module.discriminant, code);
      code.append('){');
      for (const caseNode of module.cases) {
        transform(caseNode, code);
      }
      code.append('}');
    } else if (module.type === 'SwitchCase') {
      if (module.test) {
        code.append(`case ${module.test.raw}:`);
      } else {
        code.append(`default:`);
      }
      for (const consequent of module.consequent) {
        transform(consequent, code);
      }
    } else if (module.type === 'BreakStatement') {
      code.append('break;');
    } else if (module.type === 'ForStatement') {
      code.append('for(');
      transform(module.init, code);
      transform(module.test, code);
      code.append(';');
      transform(module.update, code);
      code.append(')');
      transform(module.body, code);
    } else if (module.type === 'WhileStatement') {
      code.append('while(');
      transform(module.test, code);
      code.append(')');
      transform(module.body, code);
    } else if (module.type === 'DoWhileStatement') {
      code.append('do');
      transform(module.body, code);
      code.append('while(');
      transform(module.test, code);
      code.append(');');
    } else if (module.type === 'ReturnStatement') {
      code.append(`return `);
      transform(module.argument, code);
      code.append(';');
    } else if (module.type === 'SequenceExpression') {
      for (let i = 0; i < module.expressions.length; ++ i) {
        transform(module.expressions[i], code);
        if (i < module.expressions.length - 1) {
          code.append(',');
        }
      }
    } else if (module.type === 'UpdateExpression') {
      if (module.prefix) {
        code.append(module.operator);
      }
      transform(module.argument, code);
      if (!module.prefix) {
        code.append(module.operator);
      }
    } else if (module.type === 'Identifier') {
      code.append(module.name);
    } else if (module.type === 'Literal') {
      code.append(module.raw);
    } else if (module.type === 'ImportDeclaration') {
      if (importMap.has(module)) {
        return;
      } else {
        importMap.add(module);
      }
      const used = new Set(Array.from(module._scope.names.keys()).filter((key) => module._scope.names.get(key)));

      const vars = Array.from(module._exports).filter(
          (name) => (module._default ? module._default.type !== 'ImportDeclaration' : true) && (used.has(name) ||
          (module._defaultExport && module._default && module._defaultExport.has(name) &&
          used.has(module._default._name))) && !module._imports.has(name));
      if (vars.length) {
        for (let i = 0; i < vars.length; ++ i) {
          const variable = vars[i];
          if (importVariableMap.has(variable)) {
            let index = 1;
            let newName = `${variable}$${index}`;
            while (importVariableMap.has(newName)) {
              ++ index;
              newName = `${variable}$${index}`;
            }
            vars[i] = newName;
            const deps = module._scope.deps.get(variable);
            for (const dep of deps) {
              dep.name = newName;
            }
            importVariableMap.add(newName);
          } else {
            importVariableMap.add(variable);
          }
        }
      }

      const _bundle = new MagicString('');
      if (vars.length) {
        _bundle.append(`var {${vars.join(',')}}=(function(){`);
      }
      transform(module.body, _bundle);
      if (vars.length) {
        _bundle.append(`return {${vars.join(',')}}})();`);
      }
      code.appendLeft(0, _bundle.toString());
    } else if (module.type === 'ExportNamedDeclaration') {
      if (module.declaration) {
        transform(module.declaration, code);
      }
      if (Array.isArray(module.body)) {
        transform(module.body, code);
      }
    } else {
      if (Array.isArray(module.body)) {
        transform(module.body, code);
      }
    }
    // else if (module.type === 'ExportDefaultDeclaration') {
    // code.append(`const ${module.name}=`);
    // transform(module.declaration, code);
    // code.append(';');
    // }
  });
}

transform(modules.body, bundle);

const map = bundle.generateMap({
  source: 'source.js',
  file: 'source.js.map',
  includeContent: true,
});

fs.writeFileSync('./source.js', '\'use strict\';' + bundle.toString());
fs.writeFileSync('./source.js.map', map.toString());
