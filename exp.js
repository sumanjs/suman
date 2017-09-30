


let sym = Symbol('foo');
let sym2 = Symbol('foo');
let obj = {};
obj[sym] = 5;
console.log(obj[sym]);
console.log(obj[sym2]);


