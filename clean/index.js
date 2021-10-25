import paths from './paths';
import {exec} from 'child_process';

export default function clean(options) {
  const build = options ? options.build || paths.appBuild : paths.appBuild;
  exec(`rm -rf ${build}`);
  exec(`mkdir ${build}`);

  return {
    name: 'rollup-clean-plugin',
  };
}
