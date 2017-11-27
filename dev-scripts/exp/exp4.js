function* foo() {
  yield 1;
  yield 2;
  yield 3;
}

Array.from(foo()).forEach(function(o){
  console.log(o);
});
