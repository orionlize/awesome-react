const {NodePath, transformFromAstSync, parseSync} = require('@babel/core');
const {default: traverse} = require('@babel/traverse');
const types = require('@babel/types');
const fs = require('fs');
const path = require('path');
const {SourceMapConsumer, SourceNode} = require('source-map');

function getNodeModulesPath() {
  return path.resolve(process.cwd(), 'node_modules');
}

/**
 * 返回入口文件路径
 * @param {String} input 入口路径
 * @return {String} 入口路径
 */
function getEntry(input) {
  return path.resolve(process.cwd(), input);
}

/**
 * 获取输出目录
 * @param {String} output 输出相对路径名
 * @return {String} 输出绝对路径名
 */
function getOutput(output) {
  return path.resolve(process.cwd(), output);
}

/**
 * 尝试拓展引入模块路径
 * @param {String} modulePath 模块绝对路径
 * @param {String} originModulePath 原始引入模块路径
 * @param {Array<String>} extensions 扩展路径
 * @param {String} moduleContext 模块上下文
 * @return {String} 模块合法路径
 */
function tryExpression(
    modulePath,
    originModulePath,
    extensions,
    moduleContext,
) {
  const _extensions = [''].concat(extensions);
  for (const ext of _extensions) {
    if (fs.existsSync(modulePath + ext)) {
      return modulePath + ext;
    }
  }

  throw new Error(
      `Can't resolve ${originModulePath} in ${moduleContext}`,
  );
}

/**
 * 判断是否是导出节点
 * @param {NodePath} nodePath
 * @return {boolean}
 */
function isExportNode(nodePath) {
  return types.isExportSpecifier(nodePath) ||
  types.isExportNamedDeclaration(nodePath) ||
  types.isExportDefaultDeclaration(nodePath) ||
  types.isExportDefaultSpecifier(nodePath) ||
  types.isExportNamespaceSpecifier(nodePath);
}

/**
 * 删除该节点下的引用
 * @param {NodePath} nodePath
 * @return {void}
 */
function deleteReferences(nodePath) {
  traverse(nodePath.node, {
    Identifier: (_nodePath) => {
      const binding = _nodePath.scope.getBinding(_nodePath.node.name);
      if (binding) {
        binding.referencePaths = binding.referencePaths.filter((path) => path.node !== _nodePath.node);
        binding.references = binding.referencePaths.length;
        binding.referenced = binding.referenced > 0;
      }
    },
  }, nodePath.scope, nodePath.state, nodePath);
}

/**
 * 根据重新生成的code重新build
 * @param {NodePath} nodePath
 * @param {String} origin
 * @return {[String, NodePath]}
 */
function rebuild(nodePath, origin) {
  const {code} = transformFromAstSync(nodePath.node, origin, {
    comments: false,
  });
  const ast = parseSync(code);
  return [code, ast];
}

/**
 * 创建清空打包目录
 * @param {*} path 打包根目录
 */
function mkdir(path) {
  if (fs.existsSync(path)) {
    fs.rmSync(path, {
      recursive: true,
      force: true,
    });
  }
  fs.mkdirSync(path);
}

function generateSourceNode(code, map) {
  const theSourceMapConsumer = new SourceMapConsumer(map);
  const theGeneratedNode = SourceNode.fromStringWithSourceMap(code, theSourceMapConsumer);

  return theGeneratedNode;
}

/**
 * 处理写入的chunks到html
 * @param {Array<String>} chunks
 * @param {String} htmlSrc
 * @return {String}
 */
function fillInHtml(chunks, htmlSrc) {
  const html = fs.readFileSync(htmlSrc, {encoding: 'utf-8'});
  let [, header, , footer] = /((\r\n|\n|.)*)<\/body>((\r\n|\n|.)*)/.exec(html);
  chunks.forEach((chunk) => {
    header += `\t<script src="${chunk}"></script>\r\n\t`;
  });

  return header + '</body>' + footer;
}

module.exports = {
  getNodeModulesPath,
  getEntry,
  getOutput,
  tryExpression,
  isExportNode,
  deleteReferences,
  rebuild,
  mkdir,
  generateSourceNode,
  fillInHtml,
};
