import paths from './paths';

const express = require('express');
const expressWs = require('express-ws');
const fs = require('fs');
const path = require('path');

export default function Hot() {
  const app = express();
  expressWs(app);

  let ws = null;
  app.ws('/hmr', function(_ws, req) {
    ws = _ws;
    ws.send(JSON.stringify(['bundle.js']));
  });

  app.use(express.static(paths.appBuild));

  app.use('/', (_, res) => {
    const html = fs.readFileSync(paths.appIndex, {
      encoding: 'utf-8',
    });

    const els = html.split('</body>');
    els[0] += `<script>(${
      require(path.resolve(paths.appBuild, 'emit.js')).toString().replace(/[\r\n]/g, '')
    })(${'3000'})</script>`;
    res.send(els.join('</body>'));
  });

  app.listen(3000);
  return {
    name: 'rollup-hot-reload-plugin',
    generateBundle(outputOptions) {
      if (ws && !ws.closed) {
        ws.send(
            JSON.stringify([outputOptions.file.replace(/\.\/build\//, '')]),
        );
      }
    },
  };
}