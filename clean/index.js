import paths from './paths';
import {exec} from 'child_process';

export default function clean(options) {
  const build = options ? options.build || paths.appBuild : paths.appBuild;
  return {
    name: 'rollup-clean-plugin',
    buildStart() {
      exec(`rm -rf ${build}`);
      exec(`mkdir ${build}`);
    },
  };
}
