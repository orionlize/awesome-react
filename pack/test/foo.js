/* eslint-disable no-var */
const a = 100;
const b = 50;

export function foo() {
  const cc = 100;
  var cb = () => {
    console.log(cc);
  };
  // cb();
}
