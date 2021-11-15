'use strict'; const {base}=(function() {
  let base=100; base=function() {
    return base+100;
  }(); return {base};
})(); const {test, foo}=(function() {
  let a=base; const b=50; function test() {
    if (false) {
      var msg='hello!'; console.log(msg);
    } else if (b===50) {
      console.log(msg);
    } else {
      console.log(msg);
    } for (var i=0; i<10; i++, a++) {
      console.log(i);
    } do {
      ++i;
    } while (i<10); while (i<20) {
      ++i;
    } switch (i) {
      case 10: console.log(10); break; case 20: console.log(20); break; default: console.log('other'); break;
    } try {
      console.log(i);
    } catch (error) {
      console.log(a);
    } finally {
      console.log(111);
    }
  } function foo() {
    const cb=(cc)=>{
      console.log(cc);
    }; cb(100); function hello() {
      console.log(b);
    }hello(); return a;
  } return {test, foo};
})(); const all=Object.freeze({default: base, test: test, foo: foo}); const {b}=(function() {
  function b() {
    return 200;
  } return {b};
})(); const {base$1}=(function() {
  function base$1() {
    return 100;
  } return {base$1};
})(); const {c}=(function() {
  const c=function() {
    return base$1()+100;
  }(); return {c};
})(); all.test(); console.log(b(), base, c);
