// import rollup, {rollup as rollup1} from 'rollup';
import * as all from './foo';
import d, {base as base2} from './foo2';
import c from './top';

console.error(all.exportTest());
console.error(d(), base2, c);

const div = document.createElement('div');
div.innerText = 'hello world';

document.getElementById('root').appendChild(div);
