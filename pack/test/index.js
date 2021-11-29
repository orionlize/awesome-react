// import rollup, {rollup as rollup1} from 'rollup';
import * as all from './foo';
import d, {base} from './foo2';
import c from './top';

const {test} = require('./foo');

console.log(test);
console.log(d(), base, c);
