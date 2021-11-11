'use strict'; const {base}=(function() {
  let base=100; base=function() {
    return base+100;
  }(); return {base};
})(); console.log(base, base);
