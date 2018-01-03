#!/usr/bin/env node

// (async function(){
//
//   let z= await 5;
//   console.log('z => ',z);
//
// })();



// Object.keys({a:'b','c':'cr'}).forEach(function(k){
//   console.log('k => ', k);
//   throw 'boo';
// });

//
// const assert = require('assert');
// assert.equal(typeof (()=>{}).prototype, 'undefined');

// that's cool that arrow functions don't have a prototype property
// why not create a special kind of function that has no prototype?
// we only use the prototype, 5% of the time, or less

// the existing way

// let fn1 = function(){
//
// };
//
// assert.equal(typeof fn1.prototype, 'object');
//
// // why not a prototype-less function
// let fn2 = function(){
//
// };
//
//


// const util = require('util');
//
// process.on('warning', function (w) {
//   console.warn(w.name);
//   console.warn(w.stack);
//   console.warn(w.message);
//   console.warn(w.code);
// });
//
//
// process.emitWarning('Something happened!');

const doc = {foo:'bar'};

(function () {

  var scope = Object.create(null);
  var obscurer = {};
  for (var key in doc) {
    obscurer[key] = undefined;
  }

  with (obscurer) {
    var isolated = function() {
      'use strict';
      console.log(doc);
    };
  }

  isolated.call(scope);
})();



// const time = Date.now();
//
//
// for(let i = 0; i < 1000000; i++){
//   new Proxy({}, {
//     set: function () {
//       return true;
//     }
//   })
// }
//
//
// console.log(Date.now() - time);

// const getNewError = function () {
//    return {message: 'bar',stack:'bar'};
// };
//
// let err = true;
//
// let z  = !err && getNewError();
//
//
// console.log('z => ',z );
