import all, {rollup} from 'rollup';
import * as all from './foo';
import b, {base} from './foo2';
import c from './top';

console.log(all, rollup);
console.log(b(), base, c);
