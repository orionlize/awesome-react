const base = (function() {
  const base=100; return base;
})(); const {foo}=(function() {
  const a=base; const b=50; function foo() {
    const cb=(cc)=>{
      console.log(cc);
    }; cb(100); function hello() {
      console.log(b);
    }hello(); return a;
  } return {foo};
})(); const {foo2}=(function() {
  const a=base; const foo2=function() {
    return a;
  }; return {foo2};
})(); console.log(foo2()+5); console.log(foo());
