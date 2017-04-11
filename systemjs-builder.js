// if(!/\.suman\/node_modules\//.test(process.env.NODE_PATH)){
//   throw 'Need to set NODE_PATH env var properly.';
// }

Object.map = function (obj, fn) {
  const ret = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret[key] = fn.call(null, key, obj[key]);
    }
  }
  return ret;
};

let path = require('path');
let Builder = require('systemjs-builder');
const pkg = require('./package.json');
const deps = pkg.dependencies;


const polyfills = [
  'fs',
  'process',
  'global'

];

function getPaths() {
  return Object.map(deps, function (k, v) {

    if(polyfills.includes(k)){
      return require.resolve('suman-browser-polyfills/modules/' + k);
    }

    return require.resolve(k);
  });
}

const ft = require.resolve('ascii-table');
console.log('ft => ', ft);


let builder = new Builder(__dirname, {
  paths: getPaths(),

  map: {
    'ascii-table': 'node_modules/ascii-table/index.js',
    'colors': require.resolve('colors/safe'),
    'colors/safe': require.resolve('colors/safe'),
  }
});

let src = require.resolve('suman-browser-polyfills/modules/all-core-and-npm.js');
let dest = path.resolve(__dirname + '/dist/outfile.js');

builder
.bundle(src, dest)
.then(function () {
  console.log('Build complete');
})
.catch(function (err) {
  console.log('Build error');
  console.log(err);
});
