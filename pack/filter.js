const fs = require('fs');
const esprima = require('esprima');
const path = require('path');
const Scope = require('./scope');

class Filter {
  constructor(entry, loaders = [], parseConfig = {}) {
    this.moduleMap = new Map();
    this.defaultMap = new Map();
    this.cache = [];
    this.entry = entry;
    this.baseSrc = /(.*)\/.+\.js$/.exec(entry)[1];
    this.loaders = loaders;
    this.parseConfig = parseConfig;
  }

  parseModule(url, name, node) {
    let content = '';
    try {
      fs.accessSync(url);
      try {
        content = fs.readFileSync(url, {
          encoding: 'utf-8',
        });
      } catch (error) {

      }
    } catch (error) {
    }

    if (content) {
      this.loaders.forEach((loader) => {
        if (loader.test.test(url)) {
          content = loader.loader(content, url);
        }
      });
      return esprima.parseModule(content, this.parseConfig, function(node, meta) {
      });
    } else {
      const body = [];
      const defaultNode = node.specifiers.find((specifier) => specifier.type === esprima.Syntax.ImportDefaultSpecifier);
      if (defaultNode) {
        body.push({
          type: esprima.Syntax.VariableDeclaration,
          declarations: [{
            type: esprima.Syntax.VariableDeclarator,
            id: {
              type: esprima.Syntax.Identifier,
              name: defaultNode.local.name,
            },
            init: {
              type: esprima.Syntax.CallExpression,
              callee: {
                type: esprima.Syntax.Identifier,
                name: 'require',
              },
              arguments: [
                {
                  type: esprima.Syntax.Literal,
                  value: name,
                  raw: `\'${name}\'`,
                },
              ],
            },
          }],
          kind: 'const',
        });
        body.push({
          type: esprima.Syntax.ExportDefaultDeclaration,
          declaration: {
            type: esprima.Syntax.Identifier,
            name: defaultNode.local.name,
          },
        });
      }

      const exportNodes = node.specifiers.
          filter((specifier) => specifier.type !== esprima.Syntax.ImportDefaultSpecifier);
      if (exportNodes) {
        const properties = [];
        exportNodes.forEach((specifier) => {
          properties.push({
            type: esprima.Syntax.Property,
            key: {
              type: esprima.Syntax.Identifier,
              name: specifier.local.name,
            },
            value: {
              type: esprima.Syntax.Identifier,
              name: specifier.local.name,
            },
            kind: 'init',
            computed: false,
            method: false,
            shorthand: true,
          });
        });
        if (properties) {
          if (defaultNode) {
            body.push({
              type: esprima.Syntax.VariableDeclaration,
              declarations: [{
                type: esprima.Syntax.VariableDeclarator,
                id: {
                  type: esprima.Syntax.ObjectPattern,
                  properties,
                },
                init: {
                  type: esprima.Syntax.Identifier,
                  name: defaultNode.local.name,
                },
              }],
              kind: 'const',
            });
          } else {
            body.push({
              type: esprima.Syntax.VariableDeclaration,
              declarations: [{
                type: esprima.Syntax.VariableDeclarator,
                id: {
                  type: esprima.Syntax.ObjectPattern,
                  properties,
                },
                init: {
                  type: esprima.Syntax.CallExpression,
                  callee: {
                    type: esprima.Syntax.Identifier,
                    name: 'require',
                  },
                  arguments: [
                    {
                      type: esprima.Syntax.Literal,
                      value: name,
                      raw: `\'${name}\'`,
                    },
                  ],
                },
              }],
              kind: 'const',
            });
          }

          const specifiers = [];
          exportNodes.forEach((specifier) => {
            specifiers.push({
              type: esprima.Syntax.ExportSpecifier,
              exported: {
                type: esprima.Syntax.Identifier,
                name: specifier.local.name,
              },
              local: {
                type: esprima.Syntax.Identifier,
                name: specifier.local.name,
              },
            });
          });
          body.push({
            type: esprima.Syntax.ExportNamedDeclaration,
            declaration: null,
            specifiers,
          });
        }
      }

      return {
        body,
      };
    }
  }

  setScope(node, parent) {
    node._scope = new Scope({
      parent: parent._scope,
      block: node.type !== 'FunctionExpression' && node.type !== 'FunctionDeclaration' && node.type !== 'ImportDeclaration',
    });
    if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations) {
        parent._scope.add(declaration.id.name, node.kind !== 'var');
        if (declaration.id.type === 'Identifier') {
          parent._scope.addDeps(declaration.id.name, declaration.id);
        } if (declaration.id.type === 'ObjectPattern') {
          for (const property of declaration.id.properties) {
            parent._scope.addDeps(declaration.id.name, property.key.name);
          }
        }
      }
    }
    if (node.type === 'FunctionDeclaration') {
      parent._scope.add(node.id.name, false);
      parent._scope.addDeps(node.id.name, node.id);
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
    if (node.type === 'Identifier') {
      node._scope.addDeps(node.name, node);
    }

    for (const attribute in node) {
      if (attribute === 'property') {
        continue;
      }
      if (node[attribute] && typeof node[attribute] === 'object' && !/^_/.test(attribute)) {
        if (Array.isArray(node[attribute])) {
          for (const _node of node[attribute]) {
            this.setScope(_node, node);
          }
        } else {
          this.setScope(node[attribute], node);
        }
      }
    }
  }

  recursionModule(node, parent) {
    this.setScope(node, parent);
    if (node.type === 'ImportDeclaration') {
      const relative = node.source.value;
      if (this.moduleMap.has(relative)) {
        return this.moduleMap.get(relative);
      } else {
        this.moduleMap.set(relative, node);
      }
      node.body = [];

      const _modules = this.parseModule(path.resolve(this.baseSrc, `${relative}.js`), relative, node).body;

      let defaultExport = '';
      let rename = '';
      _modules.forEach((_node) =>{
        const ret = this.recursionModule(_node, node);
        node.body.push(ret);
        if (ret.type === 'ExportDefaultDeclaration') {
          if (ret.declaration.type === 'Identifier') {
            defaultExport = ret.declaration.name;
          } else {
            const declaration = {
              type: 'VariableDeclaration',
              declarations: [{
                id: {
                  type: 'Identifier',
                  name: 'default',
                },
                init: ret.declaration,
              }],
              kind: 'const',
            };
            node.body.push(this.recursionModule(declaration, node));
            defaultExport = 'default';
          }
        }
      });

      const exports = [];
      _modules.forEach((module) => {
        if (module.type === 'ExportNamedDeclaration') {
          for (const specifier of module.specifiers) {
            exports.push(specifier.exported.name);
          }
          if (module.declaration) {
            if (module.declaration.type === 'VariableDeclaration') {
              exports.push(module.declaration.declarations[0].id.name);
            } else if (module.declaration.type === 'FunctionDeclaration') {
              exports.push(module.declaration.id.name);
            }
          }
        }
      });
      node.specifiers.forEach((specifier) => {
        if (specifier.type === 'ImportDefaultSpecifier') {
          exports.push(specifier.local.name);
          rename = specifier.local.name;
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
          const declarations = n.declarations.filter((_n) => node._exports.has(_n.id.name) ||
          defaultExport === _n.id.name ||
          _n.id.type === 'ObjectPattern' );
          if (declarations.length > 0) {
            for (const _n of declarations) {
              if (_n.id.type === esprima.Syntax.Identifier) {
                exportNodes.set(_n.id.name, _n.id);
              } else if (_n.id.type === esprima.Syntax.ObjectPattern) {
                for (const property of _n.id.properties) {
                  exportNodes.set(property.key.name, property.key);
                }
              }
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
              if (node._exports.has(name)) {
                exportNodes.set(name, n);
              }
            });
          }
        }
      });

      node._scope._exportNodes = exportNodes;
      if (defaultExport) {
        let _default = exportNodes.get(defaultExport);
        _default = _default.type === 'ImportDeclaration' ?
        (this.defaultMap.get(_default.source.value) || (() => {
          const _ = _default._scope._exportNodes.get(defaultExport);
          _._name = _.name;
          return _;
        })()) :
        _default;
        exportNodes.set(defaultExport, _default);
        this.defaultMap.set(relative, _default);
        if (_default && !_default._name) {
          _default._name = _default.name;
          _default.name = rename || _default.name;
        }
      }
    }
    return node;
  }

  findDependencies(node) {
    if (node.type === 'Identifier') {
      node._scope.parent.contain(node.name, node);
      node._scope.parent.addDeps(node.name, node);
      return;
    }

    if (node.type === 'Program' || node.type === 'ImportDeclaration' || node.type === 'BlockStatement' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      const len = this.cache.length;
      const body = Array.isArray(node.body) ? node.body : [node.body];
      for (const _node of body) {
        if (_node.type !== 'ImportDeclaration' && _node.type !== 'VariableDeclaration' && _node.type !== 'FunctionDeclaration') {
          this.findDependencies(_node);
        } else {
          this.cache.push(_node);
        }
      }
      if (this.cache.length !== len) {
        for (const _node of this.cache) {
          if (_node.type === 'ImportDeclaration') {
            const _cache = this.cache;
            this.cache = [];

            let defaultNode = null;
            _node.specifiers.forEach((specifier) => {
              if (specifier.type === 'ImportDefaultSpecifier') {
                defaultNode = specifier;
              } else if (specifier.type === 'ImportNamespaceSpecifier') {
                _node._scope._exportNodes.forEach((value, key) => {
                  let cur = value._scope;
                  while (!cur.names.has(key)) {
                    cur = cur.parent;
                  }
                  cur.names.set(key, true);
                });
              }
            });

            if (defaultNode) {
              const identifier = this.defaultMap.get(_node.source.value);
              let _name = identifier.name;
              if (identifier.name === identifier._name) {
                _name = defaultNode.local.name;
              }

              const deps = node._scope.deps.get(_name);
              deps.forEach((dep) => {
                dep.name = identifier.name;
              });

              let _scope = identifier._scope;
              while (!_scope.names.has(identifier._name)) {
                _scope = _scope.parent;
              }

              _scope.deps.set(identifier._name, _scope.deps.get(identifier._name).concat(deps));
              node._scope.deps.set(identifier.name, []);
              _scope.names.set(identifier._name, true);
            }

            _node._exports.forEach((name) => {
              if (!defaultNode || (defaultNode && name !== defaultNode.local.name)) {
                const alias = node._scope.alias.get(name);
                let _name = name;
                if (alias) {
                  if (alias[0] === _node.source) {
                    _name = alias[1];
                  }
                }
                if (node._scope.names.has(_name)) {
                  const deps = node._scope.deps.get(_name);
                  deps.forEach((dep) => {
                    if (!dep._name) {
                      dep.name = name;
                    }
                  });

                  let cur = _node._scope;
                  while (!cur.names.has(_name)) {
                    cur = cur.parent;
                  }
                  if (cur.deps.has(name)) {
                    cur.deps.set(name, cur.deps.get(name).concat(deps));
                    if (name !== _name) {
                      node._scope.deps.set(name, []);
                    }
                    cur.names.set(name, true);
                  }
                }
              }
            });
            this.findDependencies(_node);
            this.cache = _cache;
          } else if (_node.type === 'FunctionDeclaration') {
            this.findDependencies(_node);
          } else if (_node.type === 'VariableDeclaration') {
            this.findDependencies(_node);
          }
        }
      }
      this.cache.length = len;
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
                this.findDependencies(_node);
              }
            } else {
              this.findDependencies(node[attribute]);
            }
          }
        }
      }
    }
  }

  build(node) {
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
              this.build(_node);
            }
          } else {
            this.build(node[attribute]);
          }
        }
      }
    }
  }

  filter(emitter) {
    emitter.emit('parseStart', this);
    const modules = this.parseModule(this.entry);
    const scope = new Scope({
      block: false,
    });

    modules._scope = new Scope({
      parent: scope,
      block: true,
    });

    for (const node of modules.body) {
      this.recursionModule(node, modules);
    }
    emitter.emit('parseEnd', this, modules);

    emitter.emit('treeShakingBegin', this, modules);
    this.findDependencies(modules);
    debugger;
    this.build(modules);
    debugger;
    emitter.emit('treeShakingEnd', this, modules);

    return {
      modules,
      defaultMap: this.defaultMap,
    };
  }
}

module.exports = Filter;
