#!/usr/bin/env node

const v = {
  z: true,
  foo: {two: 2}
};

let x = Object.setPrototypeOf({}, v);

x.foo = 3;

console.log(x);
console.log(v);

function* foo() {
  yield 1;
  yield 2;
  yield 3;
}

for (let o of foo()) {
  console.log(o);
}

console.log(Object.keys(new Map({a: 'b'})));

 x = {};

x.retries(5)
.foo()
.run(t => {

});

describe('danger')
.run(function () {});

const Promise = require('bluebird');
const async = require('async');

async.series({
  
    a: async function (cb) {
      return Promise.delay(500).then(v => 'zzz');
    },
  
    b: async function (cb) {
      // process.nextTick(cb, null, 'bbb');
      let c = await Promise.delay(500).then(v => 'hopkins');
      return c;
      // cb(null, 'xxx');
    }

  },
  function (err, results) {

    if (err) throw err;
    console.log('results => ', results);
    process.exit(0);
  });

// inject(j => {
//
//   return j.inject({
//     a: function(cb){
//
//     },
//
//     b: function (cb) {
//
//     }
//   });
//
//   return [j.inject('av', function (cb) {
//
//
//   })];
//
//   // b.$injected.x = z;
//
// });

// console.log(typeof [][Symbol.iterator]);

// const x = {
//   watch: {
//
//
//     per: {
//
//       foo: {
//         exec: 'suman test/*.js',
//         include: [],
//         exclude: [],
//         confOverride: {},
//         env: {}
//       },
//
//       bar: {
//         exec: 'suman --browser test/front-end/*.js',
//         include: [],
//         exclude: [],
//         confOverride: {}
//       },
//
//       baz: {
//         exec: 'exec "${SUMAN_CHANGED_TEST_FILE}"',
//         include: [],
//         exclude: [],
//         confOverride: {
//
//         }
//       }
//
//     }
//
//   }
// };
