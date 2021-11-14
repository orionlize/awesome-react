import a, {base} from './foo';
import b, {base as base2} from './foo2';
import c from './top';

// console.log(a(), b(), c());

console.log(a(), base, b(), base2, c());
