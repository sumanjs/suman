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

function getMap(){

  const ret = Object.map(deps, function (k, v) {
    let val;
    if(polyfills.includes(k)){
      val = require.resolve('suman-browser-polyfills/modules/' + k);
    }
    else{
      val = require.resolve(k);
    }

    console.log('val => ', val);
    return val;
  });

  ret['suman-browser-polyfills/modules/process'] = require.resolve('suman-browser-polyfills/modules/process');
  ret['suman-browser-polyfills/modules/global'] = require.resolve('suman-browser-polyfills/modules/global');

  //   buffer: true,
  //   child_process: 'empty',
  //   cluster: 'empty',
  //   console: true,
  //   constants: true,
  //   crypto: 'empty',
  //   dgram: 'empty',
  //   dns: 'mock',
  //   domain: true,
  //   events: true,
  //   // fs: 'empty',
  //   http: true,
  //   https: true,
  //   module: 'empty',
  //   net: 'mock',
  //   os: true,
  //   path: true,
  //   process: false,
  //   punycode: true,
  //   querystring: true,
  //   readline: 'empty',
  //   repl: 'empty',
  //   stream: true,
  //   string_decoder: true,
  //   timers: true,
  //   tls: 'mock',
  //   tty: true,
  //   url: true,
  //   util: true,
  //   v8: 'mock',
  //   vm: true,
  //   zlib: 'empty',

  return ret;
}

let builder = new Builder(__dirname, {
  // paths: getPaths(),
  defaultJSExtensions: true,
  map: getMap()
});

// let src = path.resolve(__dirname + '/node_modules/suman-browser-polyfills/modules/all-core-and-npm.js');

let src = path.resolve(__dirname + '/lib/index.js');
console.log('src => ', src);

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
