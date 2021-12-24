// import rollup, {rollup as rollup1} from 'rollup';
// import * as all from './foo';
// import d, {base as base2} from './foo2';
// import c from './top';

// console.error(all.exportTest());
// console.error(d(), base2, c);

// const div = document.createElement('div');
// div.innerText = 'hello world';

// document.getElementById('root').appendChild(div);

import React from 'react';
import ReactDOM from 'react-dom';

function createDiv() {
  return <div>123</div>;
}

ReactDOM.render(createDiv(), document.getElementById('root'));

