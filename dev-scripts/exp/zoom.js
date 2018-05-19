// const v8flags = require('v8flags');
//
// v8flags(function (err, results) {
//
//   if (err) throw err;
//
//   results.sort().forEach(function (r) {
//     console.log(r);
//   });
//
// });


const o = {};

Object.defineProperty(o,'foo', {
   get: function () {
     return '5';
   }
});

console.log(o.foo);
