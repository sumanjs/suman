

// var str = /\.test\.js$/.toString();
//
// str = str.slice(1,-1);
//
// console.log(str);
//
// console.log(new RegExp(str));

const assert = require('assert');

var a = JSON.parse(JSON.stringify({foo:'bar'}));
var b = JSON.parse(JSON.stringify({foo:'bar'}));

assert.deepEqual(a,b, 'not equal');