import * as all from './foo';
import b, {base} from './foo2';
import c from './top';
console.log(all);

console.log(b(), base, c);
