const fs = require('fs');
const path = require('path');

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

module.exports = {
  getEntry,
  getOutput,
  tryExpression,
  mkdir,
};