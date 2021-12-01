// import rollup, {rollup as rollup1} from 'rollup';
// import * as all from './foo';
import d, {base as base2} from './foo2';
import c from './top';
import {test} from './foo';

console.log(test);
console.log(d(), base2, c);
