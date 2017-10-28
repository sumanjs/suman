

// const {Transform} = require('stream');
//
// const trans = new Transform({
//    transform: function (chunk, form, cb) {
//      cb(null, 'dooo ' + chunk);
//    }
// });

// const {pt} = require('prepend-transform');
//
// const trans = pt(' [dog] ');
//
// trans.pipe(process.stdout);
//
//
// trans.write('cat');
// trans.write('cat');
// trans.end();

const path = require('path');
const item = '//turkey//';
const p = path.resolve('/suman-reporters/modules/' + item);
console.log(p);
