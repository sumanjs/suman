

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

const x = null;

x.tree  = 4;

const map = {};

Object.keys(process.env).sort().forEach(k => {
  map[k] = process.env[k];
});

const util = require('util');
console.log(util.inspect(map));

