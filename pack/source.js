'use strict'; const {a}=(function() {
  function a() {
    return 100;
  } return {a};
})(); const {b}=(function() {
  function b() {
    return 200;
  } return {b};
})(); console.log(a(), b());
