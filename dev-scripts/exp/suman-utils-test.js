

// const fs = require('fs');
// const assert = require('assert');
// console.log(process.argv);
//
// fs.open(__filename, 'r+', function (err, fd) {
//
//   if (err) throw err;
//
//   const b = Buffer.alloc(4);
//
//   fs.read(fd, b, 0, 4, 0, function (err, bytesRead, buffer) {
//
//     if (err) throw err;
//
//     console.log('data: ', bytesRead);
//     console.log('buffer: ', String(buffer));
//     assert(buffer === b);
//
//   });
// });
//

// create proxy prototype method

const assert = require('assert');

const v = {
  foo: function () {
    assert.equal(this,v);
  }
};


const foo = new Proxy(v.foo, {
  get: function (a,b,c) {
    assert.equal(this,v);
  }
});

foo.five = 5;
const x = foo.five;



