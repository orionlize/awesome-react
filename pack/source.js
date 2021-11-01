const all = (function() {
  const a=100; function foo() {
    return a+5;
  };return {foo};
})(); const {foo}=all; const {foo2}=(function() {
  const a=100; function foo2() {
    return a;
  };return {foo2};
})(); console.log(foo2()+5); console.log(foo());
