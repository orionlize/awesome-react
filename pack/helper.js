const fs = require('fs');
const path = require('path');

/**
 * 返回入口文件路径
 * @param {*} option 打包配置
 * @return {String} 入口路径
 */
function getEntry(option) {
  return path.resolve(process.cwd(), option.input);
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

module.exports = {
  getEntry,
  tryExpression,
};
