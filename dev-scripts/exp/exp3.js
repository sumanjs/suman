




function* foo() {
  yield 1;
  yield 2;
  yield 3;
}

for (let o of foo()) {
  console.log(o);
}
