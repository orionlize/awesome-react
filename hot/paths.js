const path = require('path');

const paths = {
  appSrc: path.resolve(__dirname, 'src'),
  appIndex: path.resolve(__dirname, 'index.html'),
  appHot: path.resolve(__dirname, 'hot', '_emit.js'),
  appBuild: path.resolve(__dirname, 'build'),
  appRoot: path.resolve(__dirname),
};

export default paths
;
