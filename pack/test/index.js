// import rollup, {rollup as rollup1} from 'rollup';
import * as all from './foo';
import d, {base as base2} from './foo2';
import c from './top';
import {foo} from './foo';

console.error(foo, all.exportTest);
console.error(d(), base2, c);
