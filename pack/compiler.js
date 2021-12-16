const {SyncHook} = require('tapable');
const {parseSync, transformFromAstSync, NodePath} = require('@babel/core');
const {default: traverse} = require('@babel/traverse');
const types = require('@babel/types');

const fs = require('fs');
const path = require('path');
const {getEntry, tryExpression, mkdir, getOutput, isExportNode, deleteReferences, fillInHtml, generateSourceNode} = require('./helper');
const md5 = require('md5');
const {babelConcat} = require('babel-concat-sourcemaps');

class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new SyncHook(['target']),
      emit: new SyncHook(['target']),
      done: new SyncHook(['target']),
    };
    this.entries = new Set();
    this.modules = new Map();
    this.chunks = new Set();
    this.assets = new Set();
    this.files = new Set();
    this.visited = new Set();
    this.emitIndex = 0;
    options.plugins.forEach((plugin) => {
      plugin.apply(this);
    });
  }

  _buildModule(modulePath, originModulePath = '', moduleContext = '') {
    const _modulePath = tryExpression(modulePath, originModulePath, this.options.resolve, moduleContext);
    if (this.modules.has(_modulePath)) {
      return this.modules.get(_modulePath);
    }
    let content = fs.readFileSync(
        _modulePath,
        {
          encoding: 'utf-8',
        },
    );

    const module = {
      moduleId: _modulePath,
      dependencies: new Map(),
      name: originModulePath,
      ast: null,
      exports: new Set(),
      isPack: false,
    };
    this.options.loaders.reverse().forEach((item) => {
      if (item.test.test(_modulePath)) {
        content = item.loader(content, _modulePath);
      }
    });
    const ast = parseSync(content, {
      sourceType: 'unambiguous',
    });
    traverse(ast, {
      Program: (nodePath) => {
        module.ast = nodePath;
      },
      /**
         *
         * @param {NodePath} nodePath
         */
      ImportDeclaration: (nodePath) => {
        const specifiers = nodePath.node.specifiers.filter((specifier) => {
          if (nodePath.scope.getBinding(specifier.local.name).referenced) {
            return true;
          } else {
            return false;
          }
        });
        if (specifiers.length > 0) {
          nodePath.node.specifiers = specifiers;
          const rootPath = modulePath.split('/').slice(0, -1).join('/');
          let subModulePath = path.resolve(rootPath, nodePath.node.source.extra.rawValue);
          subModulePath = this._buildModule(subModulePath, nodePath.node.source.extra.rawValue, _modulePath).moduleId;
          const dependencies = module.dependencies.get(subModulePath) || [];
          specifiers.forEach((specifier) => {
            const dependency = {
              local: specifier.local.name,
              imported: '',
              isNamespace: types.isImportNamespaceSpecifier(specifier),
            };
            if (types.isImportSpecifier(specifier)) {
              dependency.imported = specifier.imported.name;
            }
            dependencies.push(dependency);
          });
          module.dependencies.set(subModulePath, dependencies);
        } else {
          nodePath.remove();
        }
      },
      /**
         *
         * @param {NodePath} nodePath
         */
      CallExpression: (nodePath) => {
        if (nodePath.node.callee.name === 'require') {
          const rootPath = modulePath.split('/').slice(0, -1).join('/');
          let subModulePath = path.resolve(rootPath, nodePath.node.arguments[0].value);
          subModulePath = this._buildModule(subModulePath, nodePath.node.arguments[0].value, _modulePath).moduleId;
          const dependencies = module.dependencies.get(subModulePath) || [];
          if (!Array.isArray(nodePath.container)) {
            if (types.isObjectPattern(nodePath.container.id)) {
              for (const property of nodePath.container.id.properties) {
                const dependency = {
                  imported: property.key.name,
                  local: '',
                };
                if (property.value) {
                  dependency.local = property.value.name;
                }
                dependencies.push(dependency);
              }
            } else {
              dependencies.push({
                local: nodePath.container.id.name,
                imported: '',
              });
            }
          }
          module.dependencies.set(subModulePath, dependencies);
        }
      },
    });

    module._source = content;

    this.modules.set(_modulePath, module);
    return module;
  }


  /**
   * @typedef Specifier
   * @type {Object}
   * @property {String} local
   * @property {String} imported
   * @property {Boolean} isNamespace
   */
  /**
   * @typedef Module
   * @type {Object}
   * @property {NodePath} ast
   * @property {Map<String, Specifier[]>} dependencies
   * @property {String} name
   * @property {String} moduleId
   * @property {Set<String>} exports
   * @property {Set<String>} imports
   * @property {Number} index
   * @property {String} code
   * @property {Object} map
   * @property {Boolean} isPack
   */
  /**
   *
   * @param {Module}module
   */
  _mixin(module) {
    if (!this.visited.has(module)) {
      this.visited.add(module);
      module.dependencies.forEach((value, key) => {
        /** @type {NodePath} */
        const dependModule = this.modules.get(key);
        if (this.visited.has(dependModule)) {
          return;
        }
        value.forEach((dependency, i) => {
          if (dependency.imported) {
            const name = dependency.local || dependency.imported;
            const binding = dependModule.ast.scope.getBinding(dependency.imported);
            binding.referencePaths =
            binding.referencePaths.concat(module.ast.scope.getBinding(name).referencePaths);
            binding.referenced = true;
            binding.references = binding.referencePaths.length;
            if (this.options.format === 'iife') {
              module.ast.scope.getBinding(name).referencePaths.forEach((nodePath) => {
                nodePath.node.name = dependency.imported;
              });
            }
          } else if (!dependency.isNamespace) {
            const name = dependModule.ast.node.body.find((node) => types.isExportDefaultDeclaration(node)).declaration.name;
            const binding = dependModule.ast.scope.getBinding(name);
            binding.referencePaths =
            binding.referencePaths.concat(module.ast.scope.getBinding(dependency.local).referencePaths);
            binding.referenced = true;
            binding.references = binding.referencePaths.length;
            if (this.options.format === 'iife') {
              module.ast.scope.getBinding(dependency.local).referencePaths.forEach((nodePath) => {
                nodePath.node.name = name;
              });
            }
          } else {
            const entryReferencePaths = module.ast.scope.getBinding(dependency.local).referencePaths;
            const used = [];
            entryReferencePaths.forEach((reference) => {
              const name = reference.parentPath.node.property.name;
              if (name) {
                reference.node.name = name;
                const binding = dependModule.ast.scope.getBinding(name);
                binding.referencePaths.push(reference);
                binding.referenced = true;
                binding.references = binding.referencePaths.length;
                reference.parentPath.replaceWith(reference);
                used.push({
                  local: name,
                  isNamespace: false,
                  imported: name,
                });
              } else {
                reference.remove();
              }
            });
            value.splice(i, 1, ...used);
          }
        });
        this._mixin(dependModule);
      });
    }
  }

  /**
   *
   * @param {NodePath} module
   */
  _traverse(module) {
    traverse(module.ast.node, {
      /**
       *
       * @param {NodePath} nodePath
       */
      VariableDeclaration: (nodePath) => {
        if (Array.isArray(nodePath.node.declarations)) {
          const declarations = nodePath.node.declarations.filter((declaration) => {
            if (types.isObjectPattern(declaration.id)) {
              for (const property of declaration.id.properties) {
                const referencePaths = nodePath.scope.getBinding(property.key.name).referencePaths;
                if (referencePaths.filter(
                    (node) => !isExportNode(node.container) && !isExportNode(node.node)).length) {
                  return true;
                } else {
                  referencePaths.forEach((node) => {
                    if (!isExportNode(node)) {
                      node.parentPath.remove();
                    } else {
                      node.remove();
                    }
                  });
                  nodePath.shouldStop = true;
                  return false;
                }
              }
            } else if (types.isArrayPattern(declaration.id)) {
              return true;
            } else if (types.isIdentifier(declaration.id)) {
              const referencePaths = nodePath.scope.getBinding(declaration.id.name).referencePaths;
              if (referencePaths.filter(
                  (node) => !isExportNode(node.container) && !isExportNode(node.node)).length) {
                return true;
              } else {
                referencePaths.forEach((node) => {
                  if (!isExportNode(node)) {
                    node.parentPath.remove();
                  } else {
                    node.remove();
                  }
                });
                nodePath.shouldStop = true;
                return false;
              }
            }
          });
          if (declarations.length) {
            nodePath.node.declarations = declarations;
          } else {
            deleteReferences(nodePath);
            nodePath.remove();
          }
          if (nodePath.shouldStop) {
            this._traverse(module);
          }
        }
      },
      /**
       *
       * @param {NodePath} nodePath
       */
      FunctionDeclaration: (nodePath) => {
        const referencePaths = nodePath.scope.getBinding(nodePath.node.id.name).referencePaths;
        if (!referencePaths.filter((node) => !isExportNode(node.container) && !isExportNode(node.node)).length) {
          referencePaths.forEach((node) => {
            if (!isExportNode(node)) {
              node.parentPath.remove();
            } else {
              node.remove();
            }
          });
          nodePath.shouldStop = true;
          nodePath.remove();
          this._traverse(module);
        }
      },
    });
  }

  /**
   *
   * @param {Module} module
   */
  _beforeGenerate(module) {
    traverse(module.ast.node, {
      ImportDeclaration: (nodePath) => {
        nodePath.remove();
      },
    });
    traverse(module.ast.node, {
      ExportDefaultDeclaration: (nodePath) => {
        const name = nodePath.node.declaration.name;
        const binding = nodePath.scope.getBinding(name);
        const referencePaths = binding?.referencePaths;
        referencePaths && referencePaths.forEach((_nodePath) => {
          binding.identifier.name = name;
          _nodePath.node.name = name;
        });
        module.exports.add(name);
        nodePath.remove();
      },
      ExportAllDeclaration: (nodePath) => {
        nodePath.remove();
      },
      ExportNamedDeclaration: (nodePath) => {
        nodePath.node.specifiers.forEach((specifier) => {
          const name = specifier.exported.name;
          module.exports.add(name);
        });
        nodePath.remove();
      },
    });
  }

  /**
   *
   * @param {String} key
   */
  _addDependencies(key) {
    /** @type {Module} */
    const dependModule = this.modules.get(key);
    if (this.visited.has(dependModule)) {
      return;
    }
    const returns = [];
    const imports = [];
    dependModule.exports && dependModule.exports.forEach((name) => {
      const identifier = types.identifier(name);
      returns.push(types.objectProperty(
          identifier, identifier, false, true,
      ));
    });
    dependModule.dependencies.forEach((dependency, key) => {
      const md5Key = md5(key);
      const properties = [];
      dependency.forEach((val) => {
        properties.push(types.objectProperty(
            types.identifier(val.imported || val.local),
            types.identifier(val.local),
            false,
            val.imported === val.local,
        ));
      });
      const variableDeclaration = types.variableDeclaration('var', [
        types.variableDeclarator(
            types.objectPattern(properties),
            types.memberExpression(
                types.identifier('window'),
                types.identifier(md5Key),
            ),
        ),
      ]);
      imports.push(variableDeclaration);
    });
    // if (dependModule.ast.node.body.length > 0) {
    if (!dependModule.isPack) {
      dependModule.isPack = true;
      dependModule.ast.node.body = [types.expressionStatement(
          types.assignmentExpression('=', types.memberExpression(
              types.identifier('window'),
              types.stringLiteral(md5(dependModule.moduleId)),
              true,
              false,
          ), types.callExpression(
              types.arrowFunctionExpression([],
                  types.blockStatement(
                      imports.concat(
                          dependModule.ast.node.body,
                          [types.returnStatement(types.objectExpression(returns))],
                      ),
                  ),
              ), [],
          )))];
    }
    // }
    this._generate(dependModule);
  }

  /**
   *
   * @param {Module} module
   */
  _generate(module) {
    if (!this.visited.has(module)) {
      this.visited.add(module);
      module.dependencies.forEach((_, key) => {
        this._addDependencies(key);
      });
    } else {
      return;
    }
    module.index = this.emitIndex ++;
  }

  _dealEntry() {
    this.entries.forEach((entry) => {
      this.visited.clear();
      this._mixin(entry);
    });

    this.modules.forEach((module) => {
      this._traverse(module);
      if (this.options.format === 'iife') {
        this._beforeGenerate(module);
      }
    });

    if (this.options.format === 'iife') {
      this.entries.forEach((entry) => {
        this.visited.clear();
        this._addDependencies(entry.moduleId);
        this._generate(entry);
      });
    }
  }

  /**
   * split chunks
   * @param {Module[]} modules
   * @return {Module}
   */
  merge(modules) {
    const res = babelConcat(modules.map((module) => generateSourceNode(module.code, module.map)), {
      sourceMaps: true,
    });
    if (modules.length) {
      const from = modules[0];
      from.map = JSON.parse(res.map.toString());
      modules.slice(1).forEach((module) => {
        from.code += module.code;
        this.modules.delete(module.moduleId);
      });
      return from;
    }

    return null;
  }

  /**
   * 写入chunks和sourcemap
   * @param {Module} module
   * @param {String} absoluteOutput
   * @param {Array<String>} chunks
   */
  write(module, absoluteOutput, chunks) {
    let code = module.code;
    const {map, index} = module;
    const filename = `${index}.${this.entries.has(module) ? 'main' : 'chunk'}_${md5(code).slice(0, 16)}`;
    if (this.options.sourceMap) {
      code += `//# sourceMappingURL=${filename}.js.map`;
      map.file = `./${filename}.js`;
    }

    fs.writeFile(path.resolve(
        absoluteOutput, `${filename}.js`),
    code,
    (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.writeFile(
        path.resolve(absoluteOutput, `${filename}.js.map`),
        JSON.stringify(map),
        (err) => {
          if (err) {
            console.log(err);
          }
        });
    chunks.push(`./${filename}.js`);
  }

  run(callback) {
    this.hooks.run.call(this);
    for (const entry of this.options.input) {
      const entryModule = this._buildModule(getEntry(entry), entry.split('/').slice(-1)[0]);
      this.entries.add(entryModule);
    }

    this._dealEntry();

    const absoluteOutput = getOutput(this.options.output);
    mkdir(absoluteOutput);

    const chunks = [];
    if (this.options.format === 'iife') {
      this.modules.forEach((module) => {
        const {code, map} = transformFromAstSync(module.ast.node, module._source, {
          presets: [
            ['@babel/preset-env'],
            // ['minify', {
            //   booleans: false,
            //   builtIns: false,
            //   consecutiveAdds: false,
            //   deadcode: false,
            //   evaluate: false,
            //   flipComparisons: false,
            //   guards: false,
            //   infinity: false,
            //   mangle: false,
            //   memberExpressions: false,
            //   mergeVars: false,
            //   numericLiterals: false,
            //   propertyLiterals: false,
            //   regexpConstructors: false,
            //   removeConsole: false,
            //   removeDebugger: false,
            //   removeUndefined: false,
            //   replace: false,
            //   simplify: false,
            //   simplifyComparisons: false,
            //   typeConstructors: false,
            //   undefinedToVoid: false,
            // }],
          ],
          comments: false,
          sourceMaps: this.options.sourceMap,
          filenameRelative: module.moduleId,
          sourceRoot: module.moduleId.split('/').slice(0, -1).join('/'),
          shouldPrintComment: () => false,
        });
        module.map = map;
        module.code = code;
      });

      this.modules.forEach((module, key) => {
        if (this.entries.has(module)) {
          this.modules.delete(key);
        }
      });

      this.hooks.emit.call(this);

      this.modules.forEach((module) => {
        this.write(module, absoluteOutput, chunks);
      });
      this.entries.forEach((entry) => {
        this.write(entry, absoluteOutput, chunks);
      });

      fs.writeFile(path.resolve(
          absoluteOutput, `index.html`), fillInHtml(chunks, './index.html'), (err) => {
        if (err) {
          console.log(err);
        }
      });
    } else {
      // this.modules.forEach((module) => {
      //   const presets = [['minify']];
      //   if (this.options.format === 'cjs') {
      //     presets.push(['@babel/preset-env', {
      //       'targets': {
      //         esmodules: this.options.esmodules,
      //       },
      //     }]);
      //   }
      //   const {code, map} = transformFromAstSync(module.ast, module._source, {
      //     presets: presets,
      //     comments: false,
      //     sourceMaps: this.options.sourceMap,
      //     filenameRelative: module.moduleId,
      //     shouldPrintComment: () => false,
      //   });

      //   let content = code;
      //   const filename = /\.js$/.test(module.name) ? module.name : module.name + '.js';
      //   if (this.options.sourceMap) {
      //     content += `//# sourceMappingURL=${filename}.js.map`;
      //     map.file = `${filename}.js`;
      //   }

      //   fs.writeFile(path.resolve(
      //       absoluteOutput, filename),
      //   content,
      //   (err) => {
      //     if (err) {
      //       console.log(err);
      //     }
      //   });
      //   fs.writeFile(
      //       path.resolve(absoluteOutput, `${filename}.map`),
      //       JSON.stringify(map),
      //       (err) => {
      //         if (err) {
      //           console.log(err);
      //         }
      //       });
      // });
    }
    this.hooks.done.call(this);
    callback && callback();
  }
}

module.exports = Compiler;
