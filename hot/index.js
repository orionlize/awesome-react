import {exec} from 'child_process';
import paths from './paths';

const express = require('express');
const expressWs = require('express-ws');
const fs = require('fs');
const path = require('path');

export default function Hot(options) {
  const port = options.port || 3000;

  let files = [];

  const app = express();
  expressWs(app);

  let ws = null;
  app.ws('/hmr', function(_ws, req) {
    ws = _ws;
    ws.send(JSON.stringify(files));
  });

  app.use(express.static(paths.appBuild));

  app.use('/', (_, res) => {
    const html = fs.readFileSync(paths.appIndex, {
      encoding: 'utf-8',
    });

    const els = html.split('</body>');
    els[0] += `<script>(${
      require(path.resolve(paths.appHot)).toString().replace(/[\r\n]/g, '')
    })(${port})</script>`;
    res.send(els.join('</body>'));
  });

  app.listen(port, 'localhost', () => {
    exec(`open http://localhost:${port}`);
  });
  return {
    name: 'rollup-hot-reload-plugin',
    writeBundle(_, output) {
      debugger;
      const _files = [];
      for (const bundle in output) {
        if (output[bundle].isEntry) {
          if (Reflect.has(output, bundle)) {
            _files.push({
              key: output[bundle].facadeModuleId,
              value: output[bundle].fileName,
            });
          }
          fs.writeFileSync(paths.appBuild + `/${output[bundle].fileName}`, `require.config({
            urlArgs: "version=${Date.now()}"
          });` );
        }
      }
      files = _files;
      if (ws && !ws.closed) {
        ws.send(JSON.stringify(files));
      }
    },
  };
}
