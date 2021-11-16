import {rollup} from 'rollup';
import * as all from './foo';
import b, {base} from './foo2';
import c from './top';

all.test();

console.log(rollup);
console.log(b(), base, c);
