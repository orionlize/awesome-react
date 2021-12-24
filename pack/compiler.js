const fs = require('fs');
const path = require('path');
const md5 = require('md5');
const {SyncHook} = require('tapable');
const {parseSync, transformFromAstSync, NodePath} = require('@babel/core');
const {default: traverse} = require('@babel/traverse');
const t = require('@babel/types');
const {babelConcat} = require('babel-concat-sourcemaps');

const {getNodeModulesPath, getEntry, tryExpression, mkdir, getOutput, isExportNode, deleteReferences, fillInHtml, generateSourceNode} = require('./helper');
const observer = require('./performance');

class Compiler {
  constructor(options) {
    this.options = {
      esmodules: true,
      sourceMap: true,
      format: 'iife',
      resolve: ['.js', '.jsx'],
      ...options,
    };
    this.presets = [
      ['@babel/preset-env'],
      ['minify', {
        deadcode: false,
        mangle: false,
        simplify: false,
        builtIns: false,
      }],
    ];
    if (this.options.jsx) {
      this.presets.push(['@babel/preset-react']);
    }
    this.hooks = {
      run: new SyncHook(['target']),
      beforeParse: new SyncHook(['target', 'code', 'callback']),
      emit: new SyncHook(['target']),
      done: new SyncHook(['target']),
    };
    this.entries = new Set();
    this.modules = new Map();
    this.chunks = new Set();
    this.assets = new Set();
    this.files = new Set();
    this.visited = new Set();
    this.externals = new Map();
    this.emitIndex = 0;
    this.observer = observer;
    options.plugins.forEach((plugin) => {
      plugin.apply(this);
    });
    options.loaders.forEach((loader) => {
      observer.observe(loader.loader);
    });
  }

  _buildModule(modulePath, originModulePath = '', moduleContext = '', isExternal = false) {
    const _modulePath = tryExpression(modulePath, originModulePath, this.options.resolve, moduleContext);
    if (this.modules.has(_modulePath) || this.externals.has(_modulePath)) {
      return this.modules.get(_modulePath) || this.externals.get(_modulePath);
    }
    let content = fs.readFileSync(
        _modulePath,
        {
          encoding: 'utf-8',
        },
    );

    this.hooks.beforeParse.call(this, content, (after) => {
      content = after;
    });

    const module = {
      moduleId: _modulePath,
      dependencies: new Map(),
      name: originModulePath,
      ast: null,
      exports: [],
      isPack: false,
      isExternal: isExternal,
      isModule: true,
    };
    this.options.loaders.reverse().forEach((item) => {
      if (item.test.test(_modulePath)) {
        content = item.loader(content, _modulePath);
      }
    });
    const ast = parseSync(content, {
      sourceType: 'unambiguous',
      presets: this.presets,
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
          if (specifier.local.name === 'React' && /(\.js|\.ts)x$/.test(_modulePath)) {
            return true;
          }

          if (nodePath.scope.getBinding(specifier.local.name).referenced) {
            return true;
          } else {
            return false;
          }
        });
        if (specifiers.length > 0) {
          nodePath.node.specifiers = specifiers;
          let subModulePath = '';
          let _isExternal = false;

          if (/(\.\/|\.\.)/.test(nodePath.node.source.extra.rawValue)) {
            const rootPath = modulePath.split('/').slice(0, -1).join('/');
            if (_modulePath.indexOf(getNodeModulesPath()) !== 0) {
              subModulePath = path.resolve(rootPath, nodePath.node.source.extra.rawValue);
            } else {
              subModulePath = path.resolve(rootPath, nodePath.node.source.extra.rawValue);
              _isExternal = true;
            }
          } else {
            subModulePath = require.resolve(nodePath.node.source.extra.rawValue);
            _isExternal = true;
          }
          subModulePath = this._buildModule(subModulePath, nodePath.node.source.extra.rawValue, _modulePath, _isExternal).moduleId;
          const dependencies = module.dependencies.get(subModulePath) || [];
          specifiers.forEach((specifier) => {
            const dependency = {
              local: specifier.local.name,
              imported: '',
              isNamespace: t.isImportNamespaceSpecifier(specifier),
            };
            if (t.isImportSpecifier(specifier)) {
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
          let subModulePath = '';
          let _isExternal = false;
          if (/(\.\/|\.\.)/.test(nodePath.node.arguments[0].value)) {
            const rootPath = modulePath.split('/').slice(0, -1).join('/');
            if (_modulePath.indexOf(getNodeModulesPath()) !== 0) {
              subModulePath = path.resolve(rootPath, nodePath.node.arguments[0].value);
            } else {
              subModulePath = path.resolve(rootPath, nodePath.node.arguments[0].value);
              _isExternal = true;
            }
          } else {
            subModulePath = require.resolve(nodePath.node.arguments[0].value);
            _isExternal = true;
          }
          subModulePath = this._buildModule(subModulePath, nodePath.node.arguments[0].value, _modulePath, _isExternal).moduleId;
          module.dependencies.set(subModulePath, []);
          nodePath.replaceWith(t.memberExpression(
              t.memberExpression(t.identifier('window'), t.identifier(md5(subModulePath))), t.identifier('exports')),
          );
        }
      },
      /**
         *
         * @param {NodePath} nodePath
         */
      IfStatement: (nodePath) => {
        let node = nodePath.node.alternate;
        let test = nodePath.node.test;
        let body = nodePath.node.consequent.body;
        while (test) {
          if (t.isBinaryExpression(test)) {
            if (test.left.extra && test.right.extra && test.left.extra.raw === test.right.extra.raw) {
              nodePath.replaceWithMultiple(body);
              break;
            } else {
              if (t.isIfStatement(node)) {
                test = node.test;
                body = node.consequent.body;
                node = node.alternate;
              } else {
                break;
              }
            }
          } else {
            break;
          }
        }
      },
    });
    if (module.ast.node.body.some((node) => t.isImportDeclaration(node) || isExportNode(node))) {
      module.isModule = false;
    }

    module._source = content;
    if (module.isModule) {
      module.ast.node.body = [
        t.variableDeclaration('var', [
          t.variableDeclarator(t.identifier('module'), t.objectExpression(
              [t.objectProperty(
                  t.identifier('exports'),
                  t.objectExpression([]),
              )],
          )),
        ]),
        t.variableDeclaration('var', [
          t.variableDeclarator(t.identifier('exports'), t.memberExpression(
              t.identifier('module'),
              t.identifier('exports'),
          )),
        ]),
      ].concat(module.ast.node.body);
    }

    if (module.ast.node.body.length > 0) {
      if (module.isExternal) {
        this.externals.set(_modulePath, module);
      } else {
        this.modules.set(_modulePath, module);
      }
    }
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
   * @property {Array} exports
   * @property {String} code
   * @property {Object} map
   * @property {Boolean} isPack
   * @property {Boolean} isModule
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
        if (this.visited.has(dependModule) || !dependModule) {
          return;
        }
        value.forEach((dependency, i) => {
          if (dependency.imported) {
            const name = dependency.local || dependency.imported;
            const binding = dependModule.ast.scope.getBinding(dependency.imported);
            const otherReferences = module.ast.scope.getBinding(name).referencePaths;
            binding.referencePaths =
            binding.referencePaths.concat(otherReferences);
            binding.referenced = true;
            binding.references = binding.referencePaths.length;
            if (otherReferences.length > 0) {
              binding.isExport = true;
            }
          } else if (!dependency.isNamespace) {
            const name = dependModule.ast.node.body.find((node) => t.isExportDefaultDeclaration(node))?.declaration.name;
            if (name) {
              const binding = dependModule.ast.scope.getBinding(name);
              const otherReferences = module.ast.scope.getBinding(dependency.local).referencePaths;
              binding.referencePaths =
                binding.referencePaths.concat(otherReference).
                    filter((nodePath) => !isExportNode(nodePath.container));
              binding.referenced = binding.referencePaths.length > 0;
              binding.references = binding.referencePaths.length;
              if (!binding.referenced) {
                value.splice(i, 1);
              }
              if (otherReferences.length > 0) {
                binding.isExport = true;
              }
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
                binding.isExport = true;
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
            if (t.isObjectPattern(declaration.id)) {
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
            } else if (t.isArrayPattern(declaration.id)) {
              return true;
            } else if (t.isIdentifier(declaration.id)) {
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
        if (nodePath.scope.getBinding(name) && nodePath.scope.getBinding(name).isExport) {
          module.exports.push({
            name,
            isDefault: true,
          });
        }
        nodePath.remove();
      },
      ExportAllDeclaration: (nodePath) => {
        nodePath.remove();
      },
      ExportNamedDeclaration: (nodePath) => {
        nodePath.node.specifiers.forEach((specifier) => {
          const name = specifier.exported.name;
          if (nodePath.scope.getBinding(name) && nodePath.scope.getBinding(name).isExport) {
            module.exports.push({
              name,
              isDefault: false,
            });
          }
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
    const dependModule = this.modules.get(key) ?? this.externals.get(key);
    if (this.visited.has(dependModule) || !dependModule) {
      return;
    }
    const returns = [];
    const imports = [];
    if (!dependModule.isModule) {
      dependModule.exports && dependModule.exports.forEach((node) => {
        const key = t.identifier(node.name);
        let value = null;
        if (!node.ast) {
          value = t.identifier(node.name);
        } else {
          value = node.ast;
        }
        returns.push(t.objectProperty(
            node.isDefault ? t.identifier('default') : key, value, false, true,
        ));
      });
    }
    dependModule.dependencies.forEach((dependency, key) => {
      const md5Key = md5(key);
      const properties = [];
      dependency.forEach((val) => {
        properties.push(t.objectProperty(
            t.identifier(val.imported ? val.imported : 'default'),
            t.identifier(val.local),
            false,
            val.imported === val.local,
        ));
      });
      if (properties.length > 0) {
        const variableDeclaration = t.variableDeclaration('var', [
          t.variableDeclarator(
              t.objectPattern(properties),
              t.memberExpression(
                  t.identifier('window'),
                  t.identifier(md5Key),
              ),
          ),
        ]);
        imports.push(variableDeclaration);
      } else {
        if (!this.entries.has(dependModule)) {
          this.modules.delete(dependModule.moduleId);
        }
      }
    });
    if (dependModule.ast.node.body.length === 0 && returns.length === 0 && !this.externals.has(key)) {
      this.modules.delete(dependModule.moduleId);
    } else {
      if (!dependModule.isPack) {
        dependModule.isPack = true;
        const footer = [];
        if (dependModule.isModule) {
          footer.push(t.expressionStatement(t.assignmentExpression(
              '=',
              t.memberExpression(t.identifier('module'), t.identifier('default')),
              t.memberExpression(t.identifier('module'), t.identifier('exports')),
          )));
        }
        if (returns.length > 0 || dependModule.isModule) {
          footer.push(t.returnStatement(dependModule.isModule ?
              t.identifier('module') : t.objectExpression(returns)));
        }

        dependModule.ast.node.body = [t.expressionStatement(
            t.assignmentExpression('=', t.memberExpression(
                t.identifier('window'),
                t.stringLiteral(md5(dependModule.moduleId)),
                true,
                false,
            ), t.callExpression(
                t.arrowFunctionExpression([],
                    t.blockStatement(
                        imports.concat(
                            dependModule.ast.node.body,
                            footer,
                        ),
                    ),
                ), [],
            )))];
      }
    }
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
  }

  _dealEntry() {
    this.entries.forEach((entry) => {
      this.visited.clear();
      this._mixin(entry);
    });

    this.externals.forEach((module) => {
      if (this.options.format === 'iife') {
        this._beforeGenerate(module);
      }
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
   * @param {Boolean} sourceMap
   */
  write(module, absoluteOutput, chunks, sourceMap = false) {
    let code = module.code;
    if (!code) return;
    const {map} = module;
    const filename = `${this.emitIndex ++}.${this.entries.has(module) ? 'main' : 'chunk'}_${md5(code).slice(0, 16)}`;
    if (sourceMap) {
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
    if (sourceMap) {
      fs.writeFile(
          path.resolve(absoluteOutput, `${filename}.js.map`),
          JSON.stringify(map),
          (err) => {
            if (err) {
              console.log(err);
            }
          });
    }
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
          presets: this.presets,
          comments: false,
          sourceMaps: this.options.sourceMap,
          filenameRelative: module.moduleId,
          sourceRoot: module.moduleId.split('/').slice(0, -1).join('/'),
          shouldPrintComment: () => false,
        });
        module.map = map;
        module.code = code;
      });
      this.externals.forEach((module) => {
        const {code, map} = transformFromAstSync(module.ast.node, module._source, {
          presets: this.presets,
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

      this.externals.forEach((module) => {
        this.write(module, absoluteOutput, chunks);
      });
      this.modules.forEach((module) => {
        this.write(module, absoluteOutput, chunks, this.options.sourceMap);
      });
      this.entries.forEach((entry) => {
        this.write(entry, absoluteOutput, chunks, this.options.sourceMap);
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
