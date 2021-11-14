// import base from './base';

// /* eslint-disable no-var */
// var a = base;
// var b = 50;

// export function test() {
//   if (false) {
//     var msg = 'hello!';
//     console.log(msg);
//   } else if (b === 50) {
//     console.log(msg);
//   } else {
//     console.log(msg);
//   }

//   for (var i = 0; i < 10; i ++, a ++) {
//     console.log(i);
//   }

//   do {
//     ++ i;
//   } while (i < 10);
//   while (i < 20) {
//     ++ i;
//   }

//   switch (i) {
//     case 10:
//       console.log(10);
//       break;
//     case 20:
//       console.log(20);
//       break;
//     default:
//       console.log('other');
//       break;
//   }

//   try {
//     console.log(i);
//   } catch (error) {
//     console.log(a);
//   } finally {
//     console.log(111);
//   }
// }

// export function foo() {
//   const cc = 100;
//   const cb = (cc) => {
//     console.log(cc);
//   };
//   cb(100);
//   function hello() {
//     console.log(b);
//   }

//   hello();
//   return a;
// }

// export default base;

// import a from './default';
// import {base} from './base';

const base = 0;

export {
  base,
};

const a = 100;

export default a;
