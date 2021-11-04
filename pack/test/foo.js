/* eslint-disable no-var */
const a = 100;

export function foo() {
  for (var i = 0; i < 10; ++ i) {
    const a = i + 1;
    console.log(a);
  }

  i = 0;
  while (i < 10) {
    console.log(i + 10 + 5);
  }

  if ( a === 100) {
    var msg = 'hello world!';
    const b = 100;
    console.log(msg, b);
    return a + 5;
  } else {
    console.log(msg);
    return a;
  }
}
