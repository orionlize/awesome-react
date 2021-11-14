'use strict'; let {base, a}=(function() {
  const base=0; const a=100; return {base, a};
})(); const {base$1}=(function() {
  const base$1=100; base=function() {
    return base+100;
  }(); return {base$1};
})(); const {b}=(function() {
  function b() {
    return 200;
  } return {b};
})(); console.log(a(), base, b(), base$1, c());
