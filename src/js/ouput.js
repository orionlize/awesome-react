'use strict';

function base1() {
  console.log(100);
}

const a1 = /* #__PURE__*/Object.freeze({
  '__proto__': null,
  'default': base1,
});

function a() {
  console.log('=======');
}

console.log(a1, a);
