import rollup, {rollup as rollup1} from 'rollup';
import * as all from './foo';
import d, {base} from './foo2';
import c from './top';

console.log(rollup, rollup1);
console.log(d(), base, c);
