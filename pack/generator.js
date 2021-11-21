const {default: MagicString} = require('magic-string');

class Generator {
  constructor(defaultMap) {
    this.importMap = new Set();
    this.importVariableMap = new Set();
    this.defaultMap = defaultMap;
  }

  _generate(modules, code) {
    (Array.isArray(modules) ? modules : [modules]).forEach((module) => {
      if (module.type === 'VariableDeclaration') {
        if (module.declarations.length > 0) {
          code.append(`${module.kind} `);
          for (let i = 0; i < module.declarations.length; ++ i) {
            const declaration = module.declarations[i];
            this._generate(declaration.id, code);
            code.append('=');
            this._generate(declaration.init, code);
            code.append(';');
          }
        }
      } else if (module.type === 'ObjectPattern') {
        code.append('{');
        module.properties.forEach((property) => {
          this._generate(property, code);
          code.append(',');
        });
        code.append('}');
      } else if (module.type === 'Property') {
        code.append(module.key.name);
        if (module.key.name !== module.value.name) {
          code.append(':');
          code.append(module.value.name);
        }
      } else if (module.type === 'ExpressionStatement') {
        this._generate(module.expression, code);
        code.append(';');
      } else if (module.type === 'BinaryExpression') {
        if (module.left.body) {
          this._generate(module.left.body, code);
        } else {
          this._generate(module.left, code);
          code.append(module.operator);
          this._generate(module.right, code);
        }
      } else if (module.type === 'CallExpression') {
        if (module.callee.name) {
          code.append(`${module.callee.name}`);
        } else {
          this._generate(module.callee, code);
        }
        code.append('(');
        if (module.arguments) {
          for (let i = 0; i < module.arguments.length; ++ i) {
            this._generate(module.arguments[i], code);
            if (i < module.arguments.length -1) {
              code.append(',');
            }
          }
        }
        code.append(')');
      } else if (module.type === 'AssignmentExpression') {
        if (!module.deleted) {
          this._generate(module.left, code);
          code.append(module.operator);
          this._generate(module.right, code);
        }
      } else if (module.type === 'MemberExpression') {
        this._generate(module.object, code);
        code.append('.');
        this._generate(module.property, code);
      } else if (module.type === 'TryStatement') {
        code.append('try');
        if (module.block) {
          this._generate(module.block, code);
        }
        if (module.handler) {
          this._generate(module.handler, code);
        }
        if (module.finalizer) {
          code.append('finally');
          this._generate(module.finalizer, code);
        }
      } else if (module.type === 'CatchClause') {
        code.append(`catch(${module.param ? module.param.name : ''})`);
        if (module.body) {
          this._generate(module.body, code);
        }
      } else if (module.type === 'FunctionExpression') {
        code.append('function(');
        this._generate(module.params, code);
        code.append(')');
        this._generate(module.body, code);
      } else if (module.type === 'ArrowFunctionExpression') {
        code.append('(');
        this._generate(module.params, code);
        code.append(')=>');
        this._generate(module.body, code);
      } else if (module.type === 'FunctionDeclaration') {
        if (module.body) {
          code.append(`function ${module.id.name}(`);
          if (module.params) {
            for (let i = 0; i < module.params.length; ++ i) {
              this._generate(module.params[i], code);
              if (i < module.params.length -1) {
                code.append(',');
              }
            }
          }
          code.append(')');
          this._generate(module.body, code);
        }
      } else if (module.type === 'BlockStatement') {
        code.append('{');
        this._generate(module.body, code);
        code.append('}');
      } else if (module.type === 'IfStatement') {
        if (module.test) {
          code.append('if(');
          this._generate(module.test, code);
          code.append(')');
        }
        if (module.consequent) {
          this._generate(module.consequent, code);
        }
        if (module.alternate) {
          if (module.alternate.type === 'IfStatement') {
            code.append('else ');
            this._generate(module.alternate, code);
          } else {
            code.append('else');
            this._generate(module.alternate, code);
          }
        }
      } else if (module.type === 'SwitchStatement') {
        code.append('switch(');
        this._generate(module.discriminant, code);
        code.append('){');
        for (const caseNode of module.cases) {
          this._generate(caseNode, code);
        }
        code.append('}');
      } else if (module.type === 'SwitchCase') {
        if (module.test) {
          code.append(`case ${module.test.raw}:`);
        } else {
          code.append(`default:`);
        }
        for (const consequent of module.consequent) {
          this._generate(consequent, code);
        }
      } else if (module.type === 'BreakStatement') {
        code.append('break;');
      } else if (module.type === 'ForStatement') {
        code.append('for(');
        this._generate(module.init, code);
        this._generate(module.test, code);
        code.append(';');
        this._generate(module.update, code);
        code.append(')');
        this._generate(module.body, code);
      } else if (module.type === 'WhileStatement') {
        code.append('while(');
        this._generate(module.test, code);
        code.append(')');
        this._generate(module.body, code);
      } else if (module.type === 'DoWhileStatement') {
        code.append('do');
        this._generate(module.body, code);
        code.append('while(');
        this._generate(module.test, code);
        code.append(');');
      } else if (module.type === 'ReturnStatement') {
        code.append(`return `);
        this._generate(module.argument, code);
        code.append(';');
      } else if (module.type === 'SequenceExpression') {
        for (let i = 0; i < module.expressions.length; ++ i) {
          this._generate(module.expressions[i], code);
          if (i < module.expressions.length - 1) {
            code.append(',');
          }
        }
      } else if (module.type === 'UpdateExpression') {
        if (module.prefix) {
          code.append(module.operator);
        }
        this._generate(module.argument, code);
        if (!module.prefix) {
          code.append(module.operator);
        }
      } else if (module.type === 'Identifier') {
        code.append(module.name);
      } else if (module.type === 'Literal') {
        code.append(module.raw);
      } else if (module.type === 'ImportDeclaration') {
        if (this.importMap.has(module)) {
          return;
        } else {
          this.importMap.add(module);
        }

        const used = [];
        const defaultExport = this.defaultMap.get(module.source.value);
        Array.from(module._scope.names.keys()).forEach((key) => {
          if (module._scope._exportNodes.get(key) === defaultExport) {
            if (defaultExport) {
              used.push(defaultExport.name);
            }
          } else if (module._scope._exportNodes.get(key)) {
            used.push(key);
          }
        });

        const vars = used.filter((name) => !module._imports.has(name));
        if (vars.length) {
          for (let i = 0; i < vars.length; ++ i) {
            const variable = vars[i];
            if (this.importVariableMap.has(variable)) {
              let index = 1;
              let newName = `${variable}$${index}`;
              while (this.importVariableMap.has(newName)) {
                ++ index;
                newName = `${variable}$${index}`;
              }
              vars[i] = newName;
              let deps = null;
              if (defaultExport && variable === defaultExport.name) {
                deps = module._scope.deps.get(defaultExport._name);
              } else {
                deps = module._scope.deps.get(variable);
              }
              if (deps) {
                for (const dep of deps) {
                  dep.name = newName;
                }
                this.importVariableMap.add(newName);
              }
            } else {
              this.importVariableMap.add(variable);
            }
          }
        }

        const _bundle = new MagicString('');
        if (vars.length) {
          _bundle.append(`var {${vars.join(',')}}=(function(){`);
        }
        this._generate(module.body, _bundle);
        if (vars.length) {
          _bundle.append(`return{${vars.join(',')}}})();`);
        }
        const defaultSpecifier = module.specifiers.find((specifier) => specifier.type === 'ImportNamespaceSpecifier');
        if (defaultSpecifier) {
          let namespace = '';
          module._scope._exportNodes.forEach((value, key) => {
            namespace += `${value._name ? 'default' : key}:${value._name || value.name},`;
          });

          _bundle.append(`const ${defaultSpecifier.local.name}=Object.freeze({${namespace}});`);
        }
        code.appendLeft(0, _bundle.toString());
      } else if (module.type === 'ExportNamedDeclaration') {
        if (module.declaration) {
          this._generate(module.declaration, code);
        }
        if (Array.isArray(module.body)) {
          this._generate(module.body, code);
        }
      } else {
        if (Array.isArray(module.body)) {
          this._generate(module.body, code);
        }
      }
      // else if (module.type === 'ExportDefaultDeclaration') {
      // code.append(`const ${module.name}=`);
      // this._generate(module.declaration, code);
      // code.append(';');
      // }
    });
  }

  generate(modules, emitter) {
    emitter.emit('generateStart');
    const code = new MagicString('');
    this._generate(modules, code);
    emitter.emit('generateEnd');
    return code;
  }
}

module.exports = Generator;
