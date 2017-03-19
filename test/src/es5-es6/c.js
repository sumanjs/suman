
const x = eval('{a:"b"; m:"j"}');
console.log('g => ',x);


const o = eval('(function self(){return {a:"b"}})()');
console.log('k => ',o.a);


const p = eval('(function self(){return {parallel:false,timeout:3000}})()');
console.log(p);



