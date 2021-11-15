import * as all from './foo';
import b, {base} from './foo2';
import c from './top';

all.test();

console.log(b(), base, c);
