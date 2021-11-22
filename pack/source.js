'use strict'; var {rollup$1, rollup$1$1}=(function() {
  const rollup$1$1=require('rollup'); const {rollup$1$1}=rollup$1$1; return {rollup$1, rollup$1$1};
})(); const {base}=(function() {
  let base=100; base=function() {
    return base+100;
  }(); return {base};
})(); var {test, foo}=(function() {
  const a=base; const b=50; return {test, foo};
})(); const all=Object.freeze({base: undefined, test: test, foo: foo, default: base}); const {b$1}=(function() {
  function b$1() {
    return 200;
  } return {b$1};
})(); var {base$1, base$1$1}=(function() {
  function base$1$1() {
    return 100;
  } return {base$1, base$1$1};
})(); const {c$1}=(function() {
  const c$1=function() {
    return base$1$1()+100;
  }(); return {c$1};
})(); console.log(rollup$1$1, rollup); console.log(d(), base, c);
